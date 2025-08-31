package reading

import (
	"fmt"
	"time"

	"github.com/wguilherme/gitlife/internal/domain/reading"
)

type Service struct {
	repo reading.Repository
}

func NewService(repo reading.Repository) *Service {
	return &Service{
		repo: repo,
	}
}

func (s *Service) ListAll() ([]ItemDTO, error) {
	items, err := s.repo.FindAll()
	if err != nil {
		return nil, fmt.Errorf("failed to list items: %w", err)
	}
	return ToDTOList(items), nil
}

func (s *Service) ListByStatus(status string) ([]ItemDTO, error) {
	readingStatus := reading.Status(status)
	if !readingStatus.IsValid() {
		return nil, fmt.Errorf("invalid status: %s", status)
	}

	items, err := s.repo.FindByStatus(readingStatus)
	if err != nil {
		return nil, fmt.Errorf("failed to list items by status: %w", err)
	}
	return ToDTOList(items), nil
}

func (s *Service) ListByTag(tag string) ([]ItemDTO, error) {
	items, err := s.repo.FindByTag(reading.Tag(tag))
	if err != nil {
		return nil, fmt.Errorf("failed to list items by tag: %w", err)
	}
	return ToDTOList(items), nil
}

func (s *Service) GetItem(id string) (*ItemDTO, error) {
	itemID, err := reading.NewItemID(id)
	if err != nil {
		return nil, err
	}

	item, err := s.repo.FindByID(itemID)
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	dto := ToDTO(item)
	return &dto, nil
}

func (s *Service) AddItem(cmd AddItemCommand) error {
	title, err := reading.NewTitle(cmd.Title)
	if err != nil {
		return err
	}

	author := reading.Author(cmd.Author)
	if author == "" {
		author = "Unknown"
	}

	itemType := reading.ItemType(cmd.Type)
	if !itemType.IsValid() {
		itemType = reading.TypeBook
	}

	item, err := reading.NewItem(title, author, itemType)
	if err != nil {
		return fmt.Errorf("failed to create item: %w", err)
	}

	if cmd.Priority != "" {
		priority := reading.Priority(cmd.Priority)
		if priority.IsValid() {
			item.Priority = priority
		}
	}

	for _, tag := range cmd.Tags {
		item.AddTag(reading.Tag(tag))
	}

	if cmd.URL != "" {
		item.Metadata.URL = cmd.URL
	}

	return s.repo.Save(item)
}

func (s *Service) StartReading(id string) error {
	itemID, err := reading.NewItemID(id)
	if err != nil {
		return err
	}

	item, err := s.repo.FindByID(itemID)
	if err != nil {
		return fmt.Errorf("item not found: %w", err)
	}

	if err := item.Start(time.Now()); err != nil {
		return err
	}

	return s.repo.Update(item)
}

func (s *Service) UpdateProgress(cmd UpdateProgressCommand) error {
	itemID, err := reading.NewItemID(cmd.ItemID)
	if err != nil {
		return err
	}

	item, err := s.repo.FindByID(itemID)
	if err != nil {
		return fmt.Errorf("item not found: %w", err)
	}

	progress, err := reading.NewProgress(cmd.Percentage)
	if err != nil {
		return err
	}

	if cmd.CurrentPage > 0 {
		progress.CurrentPage = cmd.CurrentPage
	}

	if err := item.UpdateProgress(progress); err != nil {
		return err
	}

	return s.repo.Update(item)
}

func (s *Service) FinishReading(cmd FinishItemCommand) error {
	itemID, err := reading.NewItemID(cmd.ItemID)
	if err != nil {
		return err
	}

	item, err := s.repo.FindByID(itemID)
	if err != nil {
		return fmt.Errorf("item not found: %w", err)
	}

	rating, err := reading.NewRating(cmd.Rating)
	if err != nil {
		return err
	}

	if err := item.Finish(time.Now(), rating); err != nil {
		return err
	}

	if cmd.Review != "" {
		item.Metadata.Review = cmd.Review
	}

	return s.repo.Update(item)
}

func (s *Service) DeleteItem(id string) error {
	itemID, err := reading.NewItemID(id)
	if err != nil {
		return err
	}

	return s.repo.Delete(itemID)
}