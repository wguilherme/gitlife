package storage

import (
	"bytes"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wguilherme/gitlife/internal/config"
	"github.com/wguilherme/gitlife/internal/domain/reading"
	"github.com/wguilherme/gitlife/internal/infrastructure/git"
	"github.com/wguilherme/gitlife/internal/infrastructure/parser"
)

type MarkdownRepository struct {
	filePath   string
	parser     *parser.ReadingParser
	gitService *git.Service
	config     *config.Config
}

func NewMarkdownRepository(vaultPath string) *MarkdownRepository {
	return &MarkdownRepository{
		filePath: filepath.Join(vaultPath, "reading.md"),
		parser:   parser.NewReadingParser(),
	}
}

func NewMarkdownRepositoryWithGit(cfg *config.Config, gitService *git.Service) *MarkdownRepository {
	return &MarkdownRepository{
		filePath:   filepath.Join(cfg.VaultPath, "reading.md"),
		parser:     parser.NewReadingParser(),
		gitService: gitService,
		config:     cfg,
	}
}

func (r *MarkdownRepository) FindAll() ([]*reading.Item, error) {
	// Pull latest changes if git is configured
	if r.gitService != nil && r.config != nil && r.config.AutoSync {
		if err := r.gitService.Pull(); err != nil {
			log.Printf("Warning: git pull failed: %v", err)
		}
	}

	content, err := os.ReadFile(r.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []*reading.Item{}, nil
		}
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	return r.parser.ParseDocument(content)
}

func (r *MarkdownRepository) FindByID(id reading.ItemID) (*reading.Item, error) {
	items, err := r.FindAll()
	if err != nil {
		return nil, err
	}

	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}

	return nil, fmt.Errorf("item with ID %s not found", id)
}

func (r *MarkdownRepository) FindByStatus(status reading.Status) ([]*reading.Item, error) {
	items, err := r.FindAll()
	if err != nil {
		return nil, err
	}

	filtered := []*reading.Item{}
	for _, item := range items {
		if item.Status == status {
			filtered = append(filtered, item)
		}
	}

	return filtered, nil
}

func (r *MarkdownRepository) FindByTag(tag reading.Tag) ([]*reading.Item, error) {
	items, err := r.FindAll()
	if err != nil {
		return nil, err
	}

	filtered := []*reading.Item{}
	for _, item := range items {
		for _, itemTag := range item.Tags {
			if itemTag == tag {
				filtered = append(filtered, item)
				break
			}
		}
	}

	return filtered, nil
}

func (r *MarkdownRepository) Save(item *reading.Item) error {
	items, err := r.FindAll()
	if err != nil {
		return err
	}

	found := false
	for i, existing := range items {
		if existing.ID == item.ID {
			items[i] = item
			found = true
			break
		}
	}

	if !found {
		items = append(items, item)
	}

	return r.writeToFile(items)
}

func (r *MarkdownRepository) Update(item *reading.Item) error {
	return r.Save(item)
}

func (r *MarkdownRepository) Delete(id reading.ItemID) error {
	items, err := r.FindAll()
	if err != nil {
		return err
	}

	filtered := []*reading.Item{}
	for _, item := range items {
		if item.ID != id {
			filtered = append(filtered, item)
		}
	}

	return r.writeToFile(filtered)
}

func (r *MarkdownRepository) writeToFile(items []*reading.Item) error {
	var buf bytes.Buffer

	buf.WriteString("---\n")
	buf.WriteString("type: reading-list\n")
	buf.WriteString(fmt.Sprintf("created: %s\n", time.Now().Format("2006-01-02")))
	buf.WriteString(fmt.Sprintf("updated: %s\n", time.Now().Format("2006-01-02")))
	buf.WriteString("---\n\n")
	buf.WriteString("# Reading List\n\n")

	toRead := []*reading.Item{}
	readingItems := []*reading.Item{}
	done := []*reading.Item{}

	for _, item := range items {
		switch item.Status {
		case reading.StatusToRead:
			toRead = append(toRead, item)
		case reading.StatusReading:
			readingItems = append(readingItems, item)
		case reading.StatusDone:
			done = append(done, item)
		}
	}

	if len(toRead) > 0 {
		buf.WriteString("## 📚 To Read\n\n")
		for _, item := range toRead {
			r.writeItem(&buf, item)
		}
	}

	if len(readingItems) > 0 {
		buf.WriteString("## 📖 Reading\n\n")
		for _, item := range readingItems {
			r.writeItem(&buf, item)
		}
	}

	if len(done) > 0 {
		buf.WriteString("## ✅ Done\n\n")
		for _, item := range done {
			r.writeItem(&buf, item)
		}
	}

	dir := filepath.Dir(r.filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	if err := os.WriteFile(r.filePath, buf.Bytes(), 0644); err != nil {
		return err
	}

	// Auto-commit and push if git is configured
	if r.gitService != nil && r.config != nil && r.config.AutoCommit {
		if err := r.gitCommitAndPush("Update reading list"); err != nil {
			log.Printf("Warning: git commit/push failed: %v", err)
		}
	}

	return nil
}

func (r *MarkdownRepository) gitCommitAndPush(message string) error {
	// Add the file
	if err := r.gitService.Add([]string{"reading.md"}); err != nil {
		return fmt.Errorf("git add failed: %w", err)
	}

	// Commit
	if message == "" {
		message = r.config.CommitMessage
	}
	if err := r.gitService.Commit(message); err != nil {
		return fmt.Errorf("git commit failed: %w", err)
	}

	// Push if auto-sync is enabled
	if r.config.AutoSync {
		if err := r.gitService.Push(); err != nil {
			return fmt.Errorf("git push failed: %w", err)
		}
	}

	return nil
}

func (r *MarkdownRepository) writeItem(buf *bytes.Buffer, item *reading.Item) {
	buf.WriteString(fmt.Sprintf("### [[%s]]\n", item.Title))
	
	buf.WriteString(fmt.Sprintf("- **type**: %s\n", item.Type))
	buf.WriteString(fmt.Sprintf("- **author**: %s\n", item.Author))
	
	if len(item.Tags) > 0 {
		tags := []string{}
		for _, tag := range item.Tags {
			tags = append(tags, "#"+string(tag))
		}
		buf.WriteString(fmt.Sprintf("- **tags**: %s\n", strings.Join(tags, " ")))
	}
	
	if item.Priority != "" && item.Priority != reading.PriorityMedium {
		buf.WriteString(fmt.Sprintf("- **priority**: %s\n", item.Priority))
	}
	
	if !item.Metadata.Added.IsZero() {
		buf.WriteString(fmt.Sprintf("- **added**: %s\n", item.Metadata.Added.Format("2006-01-02")))
	}
	
	if item.Metadata.Started != nil {
		buf.WriteString(fmt.Sprintf("- **started**: %s\n", item.Metadata.Started.Format("2006-01-02")))
	}
	
	if item.Metadata.Finished != nil {
		buf.WriteString(fmt.Sprintf("- **finished**: %s\n", item.Metadata.Finished.Format("2006-01-02")))
	}
	
	if item.Progress != nil {
		if item.Progress.Percentage > 0 {
			buf.WriteString(fmt.Sprintf("- **progress**: %d%%\n", item.Progress.Percentage))
		}
		if item.Progress.CurrentPage > 0 {
			buf.WriteString(fmt.Sprintf("- **current_page**: %d\n", item.Progress.CurrentPage))
		}
		if item.Progress.TotalPages > 0 {
			buf.WriteString(fmt.Sprintf("- **pages**: %d\n", item.Progress.TotalPages))
		}
	}
	
	if item.Rating != nil {
		stars := ""
		for i := 0; i < item.Rating.Value(); i++ {
			stars += "⭐"
		}
		buf.WriteString(fmt.Sprintf("- **rating**: %s\n", stars))
	}
	
	if item.Metadata.URL != "" {
		buf.WriteString(fmt.Sprintf("- **url**: %s\n", item.Metadata.URL))
	}
	
	if item.Metadata.Notes != "" {
		buf.WriteString(fmt.Sprintf("- **notes**: %s\n", item.Metadata.Notes))
	}
	
	if item.Metadata.Review != "" {
		buf.WriteString(fmt.Sprintf("- **review**: %s\n", item.Metadata.Review))
	}
	
	buf.WriteString("\n")
}