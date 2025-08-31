package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Vault configuration
	VaultRepo   string
	VaultPath   string
	GitLifeFolder string

	// Authentication
	SSHKeyPath string

	// Git configuration
	GitUserName  string
	GitUserEmail string

	// Behavior
	AutoSync      bool
	AutoCommit    bool
	SyncInterval  time.Duration
	CommitMessage string

	// Application
	Debug bool
}

func LoadFromEnv() *Config {
	return &Config{
		// Vault
		VaultRepo:     getEnv("GITLIFE_VAULT_REPO", ""),
		VaultPath:     getEnv("GITLIFE_VAULT_PATH", "./vault"),
		GitLifeFolder: getEnv("GITLIFE_FOLDER", "gitlife"),

		// Authentication
		SSHKeyPath: getEnv("GITLIFE_SSH_KEY_PATH", expandHome("~/.ssh/id_rsa")),

		// Git
		GitUserName:  getEnv("GITLIFE_GIT_USER_NAME", "GitLife"),
		GitUserEmail: getEnv("GITLIFE_GIT_USER_EMAIL", "gitlife@local"),

		// Behavior
		AutoSync:      getBoolEnv("GITLIFE_AUTO_SYNC", true),
		AutoCommit:    getBoolEnv("GITLIFE_AUTO_COMMIT", true),
		SyncInterval:  getDurationEnv("GITLIFE_SYNC_INTERVAL", 5*time.Minute),
		CommitMessage: getEnv("GITLIFE_COMMIT_MESSAGE", "Update from GitLife"),

		// Application
		Debug: getBoolEnv("GITLIFE_DEBUG", false),
	}
}

func (c *Config) Validate() error {
	// Validation will be added as needed
	return nil
}

func (c *Config) IsProduction() bool {
	return c.VaultRepo != "" && c.SSHKeyPath != ""
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getBoolEnv(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.Atoi(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if seconds, err := strconv.Atoi(value); err == nil {
			return time.Duration(seconds) * time.Second
		}
	}
	return defaultValue
}

func expandHome(path string) string {
	if path[:2] == "~/" {
		home, _ := os.UserHomeDir()
		return home + path[1:]
	}
	return path
}