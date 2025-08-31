package reading

import (
	"errors"
	"time"
)

type Item struct {
	ID       ItemID
	Title    Title
	Author   Author
	Type     ItemType
	Status   Status
	Priority Priority
	Tags     []Tag
	Progress *Progress
	Rating   *Rating
	Metadata Metadata
}

func NewItem(title Title, author Author, itemType ItemType) (*Item, error) {
	if !itemType.IsValid() {
		return nil, errors.New("invalid item type")
	}

	return &Item{
		ID:       ItemID(generateID(string(title), string(author))),
		Title:    title,
		Author:   author,
		Type:     itemType,
		Status:   StatusToRead,
		Priority: PriorityMedium,
		Tags:     []Tag{},
		Metadata: Metadata{
			Added: time.Now(),
		},
	}, nil
}

func (i *Item) Start(date time.Time) error {
	if i.Status != StatusToRead {
		return errors.New("can only start items with 'to-read' status")
	}

	i.Status = StatusReading
	i.Metadata.Started = &date
	i.Progress = &Progress{Percentage: 0}
	
	return nil
}

func (i *Item) Finish(date time.Time, rating Rating) error {
	if i.Status != StatusReading {
		return errors.New("can only finish items with 'reading' status")
	}

	i.Status = StatusDone
	i.Metadata.Finished = &date
	i.Rating = &rating
	if i.Progress != nil {
		i.Progress.Percentage = 100
	}
	
	return nil
}

func (i *Item) UpdateProgress(progress *Progress) error {
	if i.Status != StatusReading {
		return errors.New("can only update progress for items with 'reading' status")
	}

	i.Progress = progress
	return nil
}

func (i *Item) CanTransitionTo(status Status) bool {
	if !status.IsValid() {
		return false
	}

	switch i.Status {
	case StatusToRead:
		return status == StatusReading
	case StatusReading:
		return status == StatusDone || status == StatusToRead
	case StatusDone:
		return status == StatusReading
	default:
		return false
	}
}

func (i *Item) AddTag(tag Tag) {
	for _, existing := range i.Tags {
		if existing == tag {
			return
		}
	}
	i.Tags = append(i.Tags, tag)
}

func (i *Item) RemoveTag(tag Tag) {
	filtered := []Tag{}
	for _, existing := range i.Tags {
		if existing != tag {
			filtered = append(filtered, existing)
		}
	}
	i.Tags = filtered
}

func (i *Item) SetPriority(priority Priority) error {
	if !priority.IsValid() {
		return errors.New("invalid priority")
	}
	i.Priority = priority
	return nil
}

func generateID(title, author string) string {
	return sanitizeForID(title + "-" + author)
}

func sanitizeForID(s string) string {
	result := ""
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' {
			result += string(r)
		} else if r == ' ' {
			result += "-"
		}
	}
	return result
}