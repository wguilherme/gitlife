package parser

import (
	"bufio"
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/yuin/goldmark"
	meta "github.com/yuin/goldmark-meta"
	"github.com/yuin/goldmark/ast"
	"gopkg.in/yaml.v3"
)

type Parser struct {
	md goldmark.Markdown
}

func NewParser() *Parser {
	md := goldmark.New(
		goldmark.WithExtensions(
			meta.Meta,
		),
	)
	return &Parser{md: md}
}

type Document struct {
	Metadata map[string]interface{}
	Sections []Section
	Raw      string
}

type Section struct {
	Title string
	Level int
	Items []Item
}

type Item struct {
	Title      string
	Properties map[string]string
	Content    string
}

func (p *Parser) Parse(content []byte) (*Document, error) {
	doc := &Document{
		Raw:      string(content),
		Metadata: make(map[string]interface{}),
		Sections: []Section{},
	}

	lines := bytes.Split(content, []byte("\n"))
	inFrontmatter := false
	frontmatterLines := []string{}
	contentLines := []string{}

	for i, line := range lines {
		lineStr := string(line)

		if i == 0 && lineStr == "---" {
			inFrontmatter = true
			continue
		}

		if inFrontmatter {
			if lineStr == "---" {
				inFrontmatter = false
				continue
			}
			frontmatterLines = append(frontmatterLines, lineStr)
		} else {
			contentLines = append(contentLines, lineStr)
		}
	}

	if len(frontmatterLines) > 0 {
		frontmatterContent := strings.Join(frontmatterLines, "\n")
		if err := yaml.Unmarshal([]byte(frontmatterContent), &doc.Metadata); err != nil {
			return nil, fmt.Errorf("failed to parse frontmatter: %w", err)
		}
	}

	mainContent := strings.Join(contentLines, "\n")
	doc.Sections = p.parseSections(mainContent)

	return doc, nil
}

func (p *Parser) parseSections(content string) []Section {
	sections := []Section{}
	scanner := bufio.NewScanner(strings.NewReader(content))

	var currentSection *Section
	var currentItem *Item
	inItemProperties := false

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		if strings.HasPrefix(line, "## ") {
			if currentSection != nil {
				sections = append(sections, *currentSection)
			}
			currentSection = &Section{
				Title: strings.TrimPrefix(line, "## "),
				Level: 2,
				Items: []Item{},
			}
			currentItem = nil
			inItemProperties = false
		} else if strings.HasPrefix(line, "### ") && currentSection != nil {
			if currentItem != nil {
				currentSection.Items = append(currentSection.Items, *currentItem)
			}
			title := strings.TrimPrefix(line, "### ")
			title = strings.Trim(title, "[]")
			currentItem = &Item{
				Title:      title,
				Properties: make(map[string]string),
			}
			inItemProperties = true
		} else if strings.HasPrefix(trimmed, "- **") && currentItem != nil && inItemProperties {
			parts := strings.SplitN(trimmed, ":", 2)
			if len(parts) == 2 {
				key := strings.TrimSuffix(strings.TrimPrefix(parts[0], "- **"), "**")
				value := strings.TrimSpace(parts[1])
				currentItem.Properties[key] = value
			}
		} else if trimmed == "" && inItemProperties {
			inItemProperties = false
		} else if currentItem != nil && !inItemProperties && trimmed != "" {
			if currentItem.Content != "" {
				currentItem.Content += "\n"
			}
			currentItem.Content += line
		}
	}

	if currentItem != nil && currentSection != nil {
		currentSection.Items = append(currentSection.Items, *currentItem)
	}
	if currentSection != nil {
		sections = append(sections, *currentSection)
	}

	return sections
}

func (p *Parser) parseNode(node ast.Node, source []byte) {
	ast.Walk(node, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}

		switch n.Kind() {
		case ast.KindHeading:
			heading := n.(*ast.Heading)
			_ = heading.Level
		case ast.KindList:
		case ast.KindListItem:
		}

		return ast.WalkContinue, nil
	})
}

func parseDate(dateStr string) *time.Time {
	formats := []string{
		"2006-01-02",
		"2006-01-02 15:04:05",
		time.RFC3339,
	}

	for _, format := range formats {
		if t, err := time.Parse(format, dateStr); err == nil {
			return &t
		}
	}

	return nil
}

func extractText(n ast.Node, source []byte) string {
	var buf bytes.Buffer
	for c := n.FirstChild(); c != nil; c = c.NextSibling() {
		segment := c.Lines().At(0)
		buf.Write(segment.Value(source))
	}
	return buf.String()
}
