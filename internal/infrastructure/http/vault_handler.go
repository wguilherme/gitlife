package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/wguilherme/gitlife/internal/config"
	"github.com/wguilherme/gitlife/internal/infrastructure/git"
)

type VaultHandler struct {
	config *config.Config
}

func NewVaultHandler(config *config.Config) *VaultHandler {
	return &VaultHandler{
		config: config,
	}
}

// GET /api/vault/status
func (h *VaultHandler) GetStatus(c *gin.Context) {
	svc, err := git.NewService(h.config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	exists := svc.RepoExists()
	status := gin.H{
		"exists":     exists,
		"vault_path": h.config.VaultPath,
		"vault_repo": h.config.VaultRepo,
	}

	if exists {
		// Could add more detailed git status here
		status["status"] = "ready"
	} else {
		status["status"] = "not_initialized"
	}

	c.JSON(http.StatusOK, status)
}

// POST /api/vault/init
func (h *VaultHandler) Initialize(c *gin.Context) {
	var req struct {
		Remote string `json:"remote,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Remote != "" {
		h.config.VaultRepo = req.Remote
	}

	svc, err := git.NewService(h.config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := svc.Init(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Vault initialized successfully",
		"vault_path": h.config.VaultPath,
		"remote":     h.config.VaultRepo,
	})
}

// POST /api/vault/clone
func (h *VaultHandler) Clone(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.config.VaultRepo = req.URL

	svc, err := git.NewService(h.config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := svc.Clone(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Vault cloned successfully",
		"vault_path": h.config.VaultPath,
		"url":        req.URL,
	})
}

// POST /api/vault/sync
func (h *VaultHandler) Sync(c *gin.Context) {
	svc, err := git.NewService(h.config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if !svc.RepoExists() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Vault not initialized"})
		return
	}

	if err := svc.Pull(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vault synced successfully",
	})
}
