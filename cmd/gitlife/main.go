package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"text/tabwriter"

	"github.com/spf13/cobra"
	"github.com/wguilherme/gitlife/internal/application/reading"
	"github.com/wguilherme/gitlife/internal/config"
	domainReading "github.com/wguilherme/gitlife/internal/domain/reading"
	"github.com/wguilherme/gitlife/internal/infrastructure/git"
	"github.com/wguilherme/gitlife/internal/infrastructure/storage"
)

var (
	vaultPath  string
	service    *reading.Service
	cfg        *config.Config
	gitService *git.Service
)

func main() {
	// Load configuration from environment
	cfg = config.LoadFromEnv()

	rootCmd := &cobra.Command{
		Use:   "gitlife",
		Short: "Personal productivity system for developers",
		Long:  `GitLife is a productivity system that uses Git as a database and Markdown for data storage.`,
	}

	rootCmd.PersistentFlags().StringVar(&vaultPath, "vault", cfg.VaultPath, "Path to vault directory")

	// Initialize git service if configured
	initGitService()

	readingCmd := &cobra.Command{
		Use:   "reading",
		Short: "Manage reading list",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			// Update config with CLI flag
			if vaultPath != cfg.VaultPath {
				cfg.VaultPath = vaultPath
			}

			var repo domainReading.Repository
			if gitService != nil {
				repo = storage.NewMarkdownRepositoryWithGit(cfg, gitService)
			} else {
				repo = storage.NewMarkdownRepository(vaultPath)
			}
			service = reading.NewService(repo)
		},
	}

	listCmd := &cobra.Command{
		Use:   "list",
		Short: "List reading items",
		RunE:  runList,
	}
	listCmd.Flags().String("status", "", "Filter by status (to-read, reading, done)")
	listCmd.Flags().String("tag", "", "Filter by tag")

	addCmd := &cobra.Command{
		Use:   "add [title]",
		Short: "Add a new reading item",
		Args:  cobra.MinimumNArgs(1),
		RunE:  runAdd,
	}
	addCmd.Flags().String("author", "", "Author name")
	addCmd.Flags().String("type", "book", "Item type (book, article, video, course)")
	addCmd.Flags().String("priority", "medium", "Priority (high, medium, low)")
	addCmd.Flags().StringSlice("tags", []string{}, "Tags for the item")
	addCmd.Flags().String("url", "", "URL for the item")

	startCmd := &cobra.Command{
		Use:   "start [id]",
		Short: "Start reading an item",
		Args:  cobra.ExactArgs(1),
		RunE:  runStart,
	}

	progressCmd := &cobra.Command{
		Use:   "progress [id] [percentage]",
		Short: "Update reading progress",
		Args:  cobra.ExactArgs(2),
		RunE:  runProgress,
	}
	progressCmd.Flags().Int("page", 0, "Current page number")

	finishCmd := &cobra.Command{
		Use:   "finish [id]",
		Short: "Mark item as finished",
		Args:  cobra.ExactArgs(1),
		RunE:  runFinish,
	}
	finishCmd.Flags().Int("rating", 0, "Rating (1-5)")
	finishCmd.Flags().String("review", "", "Review text")

	readingCmd.AddCommand(listCmd, addCmd, startCmd, progressCmd, finishCmd)

	// Add vault commands
	vaultCmd := createVaultCommand()

	rootCmd.AddCommand(readingCmd, vaultCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func initGitService() {
	// Only initialize if vault repo is configured
	if cfg.VaultRepo == "" {
		return
	}

	var err error
	gitService, err = git.NewService(cfg)
	if err != nil {
		log.Printf("Warning: Failed to initialize git service: %v", err)
		return
	}

	// Check if repo exists, if not try to clone
	if !gitService.RepoExists() {
		log.Printf("Vault repository not found at %s", cfg.VaultPath)
		if cfg.VaultRepo != "" {
			log.Printf("Attempting to clone from %s", cfg.VaultRepo)
			if err := gitService.Clone(); err != nil {
				log.Printf("Failed to clone repository: %v", err)
				log.Println("You can manually clone with: gitlife vault clone")
			}
		}
	}
}

func createVaultCommand() *cobra.Command {
	vaultCmd := &cobra.Command{
		Use:   "vault",
		Short: "Manage vault repository",
	}

	initCmd := &cobra.Command{
		Use:   "init",
		Short: "Initialize a new vault repository",
		RunE:  runVaultInit,
	}
	initCmd.Flags().String("remote", "", "Remote repository URL")

	cloneCmd := &cobra.Command{
		Use:   "clone [url]",
		Short: "Clone an existing vault repository",
		Args:  cobra.ExactArgs(1),
		RunE:  runVaultClone,
	}

	statusCmd := &cobra.Command{
		Use:   "status",
		Short: "Show vault repository status",
		RunE:  runVaultStatus,
	}

	syncCmd := &cobra.Command{
		Use:   "sync",
		Short: "Sync vault with remote repository",
		RunE:  runVaultSync,
	}

	vaultCmd.AddCommand(initCmd, cloneCmd, statusCmd, syncCmd)
	return vaultCmd
}

func runVaultInit(cmd *cobra.Command, args []string) error {
	remote, _ := cmd.Flags().GetString("remote")

	if remote != "" {
		cfg.VaultRepo = remote
	}

	svc, err := git.NewService(cfg)
	if err != nil {
		return err
	}

	if err := svc.Init(); err != nil {
		return err
	}

	fmt.Printf("Initialized vault repository at %s\n", cfg.VaultPath)
	if remote != "" {
		fmt.Printf("Remote set to: %s\n", remote)
	}
	return nil
}

func runVaultClone(cmd *cobra.Command, args []string) error {
	cfg.VaultRepo = args[0]

	svc, err := git.NewService(cfg)
	if err != nil {
		return err
	}

	if err := svc.Clone(); err != nil {
		return err
	}

	fmt.Printf("Cloned vault repository to %s\n", cfg.VaultPath)
	return nil
}

func runVaultStatus(cmd *cobra.Command, args []string) error {
	if gitService == nil {
		var err error
		gitService, err = git.NewService(cfg)
		if err != nil {
			return err
		}
	}

	if !gitService.RepoExists() {
		fmt.Println("No vault repository found")
		fmt.Printf("Initialize with: gitlife vault init\n")
		return nil
	}

	status, err := gitService.Status()
	if err != nil {
		return err
	}

	if len(status) == 0 {
		fmt.Println("Vault is up to date")
	} else {
		fmt.Println("Modified files:")
		for _, line := range status {
			fmt.Printf("  %s\n", line)
		}
	}

	return nil
}

func runVaultSync(cmd *cobra.Command, args []string) error {
	if gitService == nil {
		var err error
		gitService, err = git.NewService(cfg)
		if err != nil {
			return err
		}
	}

	if !gitService.RepoExists() {
		return fmt.Errorf("no vault repository found")
	}

	// Pull
	fmt.Println("Pulling latest changes...")
	if err := gitService.Pull(); err != nil {
		log.Printf("Warning: pull failed: %v", err)
	}

	// Check for local changes
	hasChanges, err := gitService.HasChanges()
	if err != nil {
		return err
	}

	if hasChanges {
		fmt.Println("Committing local changes...")
		if err := gitService.Add([]string{"."}); err != nil {
			return err
		}
		if err := gitService.Commit("Manual sync from gitlife"); err != nil {
			return err
		}
		if err := gitService.Push(); err != nil {
			return err
		}
		fmt.Println("Changes pushed successfully")
	} else {
		fmt.Println("No local changes to sync")
	}

	return nil
}

func runList(cmd *cobra.Command, args []string) error {
	status, _ := cmd.Flags().GetString("status")
	tag, _ := cmd.Flags().GetString("tag")

	var items []reading.ItemDTO
	var err error

	if status != "" {
		items, err = service.ListByStatus(status)
	} else if tag != "" {
		items, err = service.ListByTag(tag)
	} else {
		items, err = service.ListAll()
	}

	if err != nil {
		return err
	}

	if len(items) == 0 {
		fmt.Println("No items found")
		return nil
	}

	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "ID\tTITLE\tAUTHOR\tTYPE\tSTATUS\tPROGRESS")
	fmt.Fprintln(w, "---\t-----\t------\t----\t------\t--------")

	for _, item := range items {
		progress := ""
		if item.Progress > 0 {
			progress = fmt.Sprintf("%d%%", item.Progress)
		}
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\t%s\n",
			truncate(item.ID, 20),
			truncate(item.Title, 30),
			truncate(item.Author, 20),
			item.Type,
			item.Status,
			progress,
		)
	}

	return w.Flush()
}

func runAdd(cmd *cobra.Command, args []string) error {
	title := strings.Join(args, " ")
	author, _ := cmd.Flags().GetString("author")
	itemType, _ := cmd.Flags().GetString("type")
	priority, _ := cmd.Flags().GetString("priority")
	tags, _ := cmd.Flags().GetStringSlice("tags")
	url, _ := cmd.Flags().GetString("url")

	command := reading.AddItemCommand{
		Title:    title,
		Author:   author,
		Type:     itemType,
		Priority: priority,
		Tags:     tags,
		URL:      url,
	}

	if err := service.AddItem(command); err != nil {
		return err
	}

	fmt.Printf("Added: %s\n", title)
	return nil
}

func runStart(cmd *cobra.Command, args []string) error {
	id := args[0]
	if err := service.StartReading(id); err != nil {
		return err
	}
	fmt.Printf("Started reading: %s\n", id)
	return nil
}

func runProgress(cmd *cobra.Command, args []string) error {
	id := args[0]
	percentage := 0
	fmt.Sscanf(args[1], "%d", &percentage)
	page, _ := cmd.Flags().GetInt("page")

	command := reading.UpdateProgressCommand{
		ItemID:      id,
		Percentage:  percentage,
		CurrentPage: page,
	}

	if err := service.UpdateProgress(command); err != nil {
		return err
	}

	fmt.Printf("Updated progress for: %s (%d%%)\n", id, percentage)
	return nil
}

func runFinish(cmd *cobra.Command, args []string) error {
	id := args[0]
	rating, _ := cmd.Flags().GetInt("rating")
	review, _ := cmd.Flags().GetString("review")

	command := reading.FinishItemCommand{
		ItemID: id,
		Rating: rating,
		Review: review,
	}

	if err := service.FinishReading(command); err != nil {
		return err
	}

	fmt.Printf("Finished: %s\n", id)
	return nil
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-3] + "..."
}
