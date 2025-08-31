package parser

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/wguilherme/gitlife/internal/domain/reading"
)

type ReadingParser struct {
	parser *Parser
}

func NewReadingParser() *ReadingParser {
	return &ReadingParser{
		parser: NewParser(),
	}
}

func (rp *ReadingParser) ParseDocument(content []byte) ([]*reading.Item, error) {
	doc, err := rp.parser.Parse(content)
	if err != nil {
		return nil, fmt.Errorf("failed to parse document: %w", err)
	}

	items := []*reading.Item{}

	for _, section := range doc.Sections {
		status := rp.sectionToStatus(section.Title)
		if status == "" {
			continue
		}

		for _, item := range section.Items {
			readingItem, err := rp.itemToReadingItem(item, status)
			if err != nil {
				continue
			}
			items = append(items, readingItem)
		}
	}

	return items, nil
}

func (rp *ReadingParser) sectionToStatus(title string) reading.Status {
	title = strings.ToLower(title)

	if strings.Contains(title, "to read") || strings.Contains(title, "backlog") {
		return reading.StatusToRead
	}
	if strings.Contains(title, "reading") || strings.Contains(title, "in progress") {
		return reading.StatusReading
	}
	if strings.Contains(title, "done") || strings.Contains(title, "completed") || strings.Contains(title, "finished") {
		return reading.StatusDone
	}

	return ""
}

func (rp *ReadingParser) itemToReadingItem(item Item, status reading.Status) (*reading.Item, error) {
	title, err := reading.NewTitle(item.Title)
	if err != nil {
		return nil, err
	}

	author := reading.Author(item.Properties["author"])
	if author == "" {
		author = "Unknown"
	}

	itemType := rp.parseItemType(item.Properties["type"])
	if itemType == "" {
		itemType = reading.TypeBook
	}

	readingItem, err := reading.NewItem(title, author, itemType)
	if err != nil {
		return nil, err
	}

	readingItem.Status = status
	readingItem.Priority = rp.parsePriority(item.Properties["priority"])
	readingItem.Tags = rp.parseTags(item.Properties["tags"])

	metadata := reading.Metadata{
		URL:    item.Properties["url"],
		Notes:  item.Properties["notes"],
		Review: item.Properties["review"],
	}

	if addedStr := item.Properties["added"]; addedStr != "" {
		if t := parseDate(addedStr); t != nil {
			metadata.Added = *t
		}
	}

	if startedStr := item.Properties["started"]; startedStr != "" {
		if t := parseDate(startedStr); t != nil {
			metadata.Started = t
		}
	}

	if finishedStr := item.Properties["finished"]; finishedStr != "" {
		if t := parseDate(finishedStr); t != nil {
			metadata.Finished = t
		}
	}

	readingItem.Metadata = metadata

	if progressStr := item.Properties["progress"]; progressStr != "" {
		if percentage := rp.parseProgress(progressStr); percentage > 0 {
			readingItem.Progress = &reading.Progress{
				Percentage: percentage,
			}
		}
	}

	if currentPageStr := item.Properties["current_page"]; currentPageStr != "" {
		if currentPage, err := strconv.Atoi(currentPageStr); err == nil && readingItem.Progress != nil {
			readingItem.Progress.CurrentPage = currentPage
		}
	}

	if pagesStr := item.Properties["pages"]; pagesStr != "" {
		if pages, err := strconv.Atoi(pagesStr); err == nil && readingItem.Progress != nil {
			readingItem.Progress.TotalPages = pages
		}
	}

	if ratingStr := item.Properties["rating"]; ratingStr != "" {
		if ratingVal := rp.parseRating(ratingStr); ratingVal > 0 {
			rating, _ := reading.NewRating(ratingVal)
			readingItem.Rating = &rating
		}
	}

	return readingItem, nil
}

func (rp *ReadingParser) parseItemType(typeStr string) reading.ItemType {
	switch strings.ToLower(typeStr) {
	case "book":
		return reading.TypeBook
	case "article":
		return reading.TypeArticle
	case "video":
		return reading.TypeVideo
	case "course":
		return reading.TypeCourse
	default:
		return ""
	}
}

func (rp *ReadingParser) parsePriority(priorityStr string) reading.Priority {
	switch strings.ToLower(priorityStr) {
	case "high":
		return reading.PriorityHigh
	case "medium":
		return reading.PriorityMedium
	case "low":
		return reading.PriorityLow
	default:
		return reading.PriorityMedium
	}
}

func (rp *ReadingParser) parseTags(tagsStr string) []reading.Tag {
	tags := []reading.Tag{}
	parts := strings.Fields(tagsStr)

	for _, part := range parts {
		tag := strings.TrimPrefix(part, "#")
		if tag != "" {
			tags = append(tags, reading.Tag(tag))
		}
	}

	return tags
}

func (rp *ReadingParser) parseProgress(progressStr string) int {
	progressStr = strings.TrimSuffix(progressStr, "%")
	if val, err := strconv.Atoi(progressStr); err == nil {
		return val
	}
	return 0
}

func (rp *ReadingParser) parseRating(ratingStr string) int {
	stars := strings.Count(ratingStr, "⭐")
	if stars > 0 {
		return stars
	}

	if val, err := strconv.Atoi(ratingStr); err == nil {
		return val
	}

	return 0
}
