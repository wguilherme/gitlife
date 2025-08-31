package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wguilherme/gitlife/internal/application/reading"
)

type ReadingHandler struct {
	service *reading.Service
}

func NewReadingHandler(service *reading.Service) *ReadingHandler {
	return &ReadingHandler{
		service: service,
	}
}

// GET /api/reading
func (h *ReadingHandler) List(c *gin.Context) {
	status := c.Query("status")
	tag := c.Query("tag")

	var items []reading.ItemDTO
	var err error

	switch {
	case status != "":
		items, err = h.service.ListByStatus(status)
	case tag != "":
		items, err = h.service.ListByTag(tag)
	default:
		items, err = h.service.ListAll()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"count": len(items),
	})
}

// GET /api/reading/:id
func (h *ReadingHandler) GetItem(c *gin.Context) {
	id := c.Param("id")

	item, err := h.service.GetItem(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

// POST /api/reading
func (h *ReadingHandler) AddItem(c *gin.Context) {
	var cmd reading.AddItemCommand
	if err := c.ShouldBindJSON(&cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AddItem(cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Item added successfully"})
}

// PUT /api/reading/:id/start
func (h *ReadingHandler) StartReading(c *gin.Context) {
	id := c.Param("id")

	if err := h.service.StartReading(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reading started"})
}

// PUT /api/reading/:id/progress
func (h *ReadingHandler) UpdateProgress(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Percentage  int `json:"percentage" binding:"required,min=0,max=100"`
		CurrentPage int `json:"current_page,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cmd := reading.UpdateProgressCommand{
		ItemID:      id,
		Percentage:  req.Percentage,
		CurrentPage: req.CurrentPage,
	}

	if err := h.service.UpdateProgress(cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Progress updated"})
}

// PUT /api/reading/:id/finish
func (h *ReadingHandler) FinishReading(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Rating int    `json:"rating" binding:"required,min=1,max=5"`
		Review string `json:"review,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cmd := reading.FinishItemCommand{
		ItemID: id,
		Rating: req.Rating,
		Review: req.Review,
	}

	if err := h.service.FinishReading(cmd); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reading finished"})
}

// DELETE /api/reading/:id
func (h *ReadingHandler) DeleteItem(c *gin.Context) {
	id := c.Param("id")

	if err := h.service.DeleteItem(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item deleted"})
}

// GET /api/reading/stats
func (h *ReadingHandler) GetStats(c *gin.Context) {
	all, err := h.service.ListAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	stats := struct {
		Total    int `json:"total"`
		ToRead   int `json:"to_read"`
		Reading  int `json:"reading"`
		Finished int `json:"finished"`
	}{}

	for _, item := range all {
		stats.Total++
		switch item.Status {
		case "to-read":
			stats.ToRead++
		case "reading":
			stats.Reading++
		case "finished":
			stats.Finished++
		}
	}

	c.JSON(http.StatusOK, stats)
}
