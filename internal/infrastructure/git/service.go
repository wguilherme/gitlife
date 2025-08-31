package git

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wguilherme/gitlife/internal/config"
)

type Service struct {
	repoPath   string
	repoURL    string
	sshKeyPath string
	userConfig UserConfig
	debug      bool
}

type UserConfig struct {
	Name  string
	Email string
}

func NewService(cfg *config.Config) (*Service, error) {
	return &Service{
		repoPath:   cfg.VaultPath,
		repoURL:    cfg.VaultRepo,
		sshKeyPath: cfg.SSHKeyPath,
		userConfig: UserConfig{
			Name:  cfg.GitUserName,
			Email: cfg.GitUserEmail,
		},
		debug: cfg.Debug,
	}, nil
}

func (s *Service) setupSSH() {
	if s.sshKeyPath != "" && fileExists(s.sshKeyPath) {
		sshCommand := fmt.Sprintf(
			"ssh -i %s -o StrictHostKeyChecking=accept-new",
			s.sshKeyPath,
		)
		os.Setenv("GIT_SSH_COMMAND", sshCommand)
	}
}

func (s *Service) RepoExists() bool {
	gitDir := filepath.Join(s.repoPath, ".git")
	return dirExists(gitDir)
}

func (s *Service) Init() error {
	if s.RepoExists() {
		return nil
	}

	if err := os.MkdirAll(s.repoPath, 0755); err != nil {
		return fmt.Errorf("failed to create vault directory: %w", err)
	}

	if err := s.runGitCommand("init"); err != nil {
		return fmt.Errorf("git init failed: %w", err)
	}

	if err := s.configureUser(); err != nil {
		return err
	}

	if s.repoURL != "" {
		if err := s.runGitCommand("remote", "add", "origin", s.repoURL); err != nil {
			return fmt.Errorf("failed to add remote: %w", err)
		}
	}

	return nil
}

func (s *Service) Clone() error {
	if s.repoURL == "" {
		return fmt.Errorf("repository URL is required for clone")
	}

	s.setupSSH()

	parentDir := filepath.Dir(s.repoPath)
	if err := os.MkdirAll(parentDir, 0755); err != nil {
		return fmt.Errorf("failed to create parent directory: %w", err)
	}

	cmd := exec.Command("git", "clone", s.repoURL, s.repoPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git clone failed: %w\nOutput: %s", err, output)
	}

	return s.configureUser()
}

func (s *Service) Pull() error {
	s.setupSSH()

	if !s.RepoExists() {
		return fmt.Errorf("repository does not exist at %s", s.repoPath)
	}

	if err := s.runGitCommand("pull", "--rebase"); err != nil {
		return fmt.Errorf("git pull failed: %w", err)
	}

	return nil
}

func (s *Service) Add(files []string) error {
	args := append([]string{"add"}, files...)
	if err := s.runGitCommand(args...); err != nil {
		return fmt.Errorf("git add failed: %w", err)
	}
	return nil
}

func (s *Service) Commit(message string) error {
	if message == "" {
		message = "Update from GitLife"
	}

	if err := s.runGitCommand("commit", "-m", message); err != nil {
		if strings.Contains(err.Error(), "nothing to commit") {
			return nil
		}
		return fmt.Errorf("git commit failed: %w", err)
	}

	return nil
}

func (s *Service) Push() error {
	s.setupSSH()

	if err := s.runGitCommand("push"); err != nil {
		if strings.Contains(err.Error(), "up-to-date") ||
			strings.Contains(err.Error(), "up to date") {
			return nil
		}
		return fmt.Errorf("git push failed: %w", err)
	}

	return nil
}

func (s *Service) Status() ([]string, error) {
	output, err := s.runGitCommandOutput("status", "--porcelain")
	if err != nil {
		return nil, fmt.Errorf("git status failed: %w", err)
	}

	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) == 1 && lines[0] == "" {
		return []string{}, nil
	}

	return lines, nil
}

func (s *Service) HasChanges() (bool, error) {
	status, err := s.Status()
	if err != nil {
		return false, err
	}
	return len(status) > 0, nil
}

func (s *Service) configureUser() error {
	if s.userConfig.Name != "" {
		if err := s.runGitCommand("config", "user.name", s.userConfig.Name); err != nil {
			return fmt.Errorf("failed to set user.name: %w", err)
		}
	}

	if s.userConfig.Email != "" {
		if err := s.runGitCommand("config", "user.email", s.userConfig.Email); err != nil {
			return fmt.Errorf("failed to set user.email: %w", err)
		}
	}

	return nil
}

func (s *Service) runGitCommand(args ...string) error {
	cmd := exec.Command("git", args...)
	cmd.Dir = s.repoPath

	if s.debug {
		fmt.Printf("[DEBUG] Running: git %s in %s\n", strings.Join(args, " "), s.repoPath)
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%w\nOutput: %s", err, output)
	}

	return nil
}

func (s *Service) runGitCommandOutput(args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = s.repoPath

	if s.debug {
		fmt.Printf("[DEBUG] Running: git %s in %s\n", strings.Join(args, " "), s.repoPath)
	}

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("%w\nOutput: %s", err, output)
	}

	return string(output), nil
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return !info.IsDir()
}

func dirExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}
