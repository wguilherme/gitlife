package reading

import (
	"errors"
	"time"
)

type Status string

const (
	StatusToRead  Status = "to-read"
	StatusReading Status = "reading"
	StatusDone    Status = "done"
)

func (s Status) IsValid() bool {
	switch s {
	case StatusToRead, StatusReading, StatusDone:
		return true
	default:
		return false
	}
}

func (s Status) String() string {
	return string(s)
}

type Priority string

const (
	PriorityHigh   Priority = "high"
	PriorityMedium Priority = "medium"
	PriorityLow    Priority = "low"
)

func (p Priority) IsValid() bool {
	switch p {
	case PriorityHigh, PriorityMedium, PriorityLow:
		return true
	default:
		return false
	}
}

type ItemType string

const (
	TypeBook    ItemType = "book"
	TypeArticle ItemType = "article"
	TypeVideo   ItemType = "video"
	TypeCourse  ItemType = "course"
)

func (t ItemType) IsValid() bool {
	switch t {
	case TypeBook, TypeArticle, TypeVideo, TypeCourse:
		return true
	default:
		return false
	}
}

type ItemID string

func NewItemID(value string) (ItemID, error) {
	if value == "" {
		return "", errors.New("item ID cannot be empty")
	}
	return ItemID(value), nil
}

func (id ItemID) String() string {
	return string(id)
}

type Title string

func NewTitle(value string) (Title, error) {
	if value == "" {
		return "", errors.New("title cannot be empty")
	}
	return Title(value), nil
}

func (t Title) String() string {
	return string(t)
}

type Author string

func (a Author) String() string {
	return string(a)
}

type Tag string

func (t Tag) String() string {
	return string(t)
}

type Rating int

func NewRating(value int) (Rating, error) {
	if value < 0 || value > 5 {
		return 0, errors.New("rating must be between 0 and 5")
	}
	return Rating(value), nil
}

func (r Rating) Value() int {
	return int(r)
}

type Progress struct {
	Percentage  int
	CurrentPage int
	TotalPages  int
}

func NewProgress(percentage int) (*Progress, error) {
	if percentage < 0 || percentage > 100 {
		return nil, errors.New("progress percentage must be between 0 and 100")
	}
	return &Progress{Percentage: percentage}, nil
}

type Metadata struct {
	Added    time.Time
	Started  *time.Time
	Finished *time.Time
	URL      string
	Notes    string
	Review   string
}