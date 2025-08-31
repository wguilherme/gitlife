package http

import (
	"fmt"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/wguilherme/gitlife/internal/application/reading"
	"github.com/wguilherme/gitlife/internal/config"
	domainReading "github.com/wguilherme/gitlife/internal/domain/reading"
	"github.com/wguilherme/gitlife/internal/infrastructure/git"
	"github.com/wguilherme/gitlife/internal/infrastructure/storage"
)

type Server struct {
	router *gin.Engine
	config *config.Config
	port   string
}

func NewServer(config *config.Config, port string) *Server {
	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)

	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	return &Server{
		router: router,
		config: config,
		port:   port,
	}
}

func (s *Server) SetupRoutes() error {
	// Initialize services
	readingService, err := s.initReadingService()
	if err != nil {
		return fmt.Errorf("failed to initialize reading service: %w", err)
	}

	// Initialize handlers
	readingHandler := NewReadingHandler(readingService)
	vaultHandler := NewVaultHandler(s.config)

	// Health check
	s.router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "gitlife-api",
			"version": "0.0.2",
		})
	})

	// API routes
	api := s.router.Group("/api")
	{
		// Reading routes
		reading := api.Group("/reading")
		{
			reading.GET("", readingHandler.List)
			reading.GET("/stats", readingHandler.GetStats)
			reading.GET("/:id", readingHandler.GetItem)
			reading.POST("", readingHandler.AddItem)
			reading.PUT("/:id/start", readingHandler.StartReading)
			reading.PUT("/:id/progress", readingHandler.UpdateProgress)
			reading.PUT("/:id/finish", readingHandler.FinishReading)
			reading.DELETE("/:id", readingHandler.DeleteItem)
		}

		// Vault routes
		vault := api.Group("/vault")
		{
			vault.GET("/status", vaultHandler.GetStatus)
			vault.POST("/init", vaultHandler.Initialize)
			vault.POST("/clone", vaultHandler.Clone)
			vault.POST("/sync", vaultHandler.Sync)
		}
	}

	return nil
}

func (s *Server) initReadingService() (*reading.Service, error) {
	var repo domainReading.Repository

	// Try to initialize git service if configured
	gitService, err := git.NewService(s.config)
	if err == nil && gitService.RepoExists() {
		repo = storage.NewMarkdownRepositoryWithGit(s.config, gitService)
	} else {
		repo = storage.NewMarkdownRepository(s.config.VaultPath)
	}

	return reading.NewService(repo), nil
}

func (s *Server) Start() error {
	if err := s.SetupRoutes(); err != nil {
		return err
	}

	fmt.Printf("🚀 GitLife API Server starting on port %s\n", s.port)
	fmt.Printf("📋 Health check: http://localhost:%s/health\n", s.port)
	fmt.Printf("📚 Reading API: http://localhost:%s/api/reading\n", s.port)
	fmt.Printf("🗄️  Vault API: http://localhost:%s/api/vault\n", s.port)

	return s.router.Run(":" + s.port)
}

func (s *Server) GetRouter() *gin.Engine {
	return s.router
}
