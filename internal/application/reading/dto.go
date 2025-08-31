package reading

import (
	"time"

	"github.com/wguilherme/gitlife/internal/domain/reading"
)

type AddItemCommand struct {
	Title    string
	Author   string
	Type     string
	Priority string
	Tags     []string
	URL      string
}

type UpdateProgressCommand struct {
	ItemID      string
	Percentage  int
	CurrentPage int
}

type FinishItemCommand struct {
	ItemID string
	Rating int
	Review string
}

type ItemDTO struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Author      string    `json:"author"`
	Type        string    `json:"type"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	Tags        []string  `json:"tags"`
	Progress    int       `json:"progress,omitempty"`
	CurrentPage int       `json:"current_page,omitempty"`
	TotalPages  int       `json:"total_pages,omitempty"`
	Rating      int       `json:"rating,omitempty"`
	URL         string    `json:"url,omitempty"`
	Notes       string    `json:"notes,omitempty"`
	Review      string    `json:"review,omitempty"`
	Added       time.Time `json:"added"`
	Started     *time.Time `json:"started,omitempty"`
	Finished    *time.Time `json:"finished,omitempty"`
}

func ToDTO(item *reading.Item) ItemDTO {
	dto := ItemDTO{
		ID:       string(item.ID),
		Title:    string(item.Title),
		Author:   string(item.Author),
		Type:     string(item.Type),
		Status:   string(item.Status),
		Priority: string(item.Priority),
		Tags:     []string{},
		URL:      item.Metadata.URL,
		Notes:    item.Metadata.Notes,
		Review:   item.Metadata.Review,
		Added:    item.Metadata.Added,
		Started:  item.Metadata.Started,
		Finished: item.Metadata.Finished,
	}

	for _, tag := range item.Tags {
		dto.Tags = append(dto.Tags, string(tag))
	}

	if item.Progress != nil {
		dto.Progress = item.Progress.Percentage
		dto.CurrentPage = item.Progress.CurrentPage
		dto.TotalPages = item.Progress.TotalPages
	}

	if item.Rating != nil {
		dto.Rating = item.Rating.Value()
	}

	return dto
}

func ToDTOList(items []*reading.Item) []ItemDTO {
	dtos := []ItemDTO{}
	for _, item := range items {
		dtos = append(dtos, ToDTO(item))
	}
	return dtos
}