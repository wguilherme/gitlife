package git

import (
	"log"
	"time"
)

type SyncService struct {
	git      *Service
	interval time.Duration
	stop     chan bool
	running  bool
}

func NewSyncService(git *Service, interval time.Duration) *SyncService {
	return &SyncService{
		git:      git,
		interval: interval,
		stop:     make(chan bool),
	}
}

func (s *SyncService) Start() {
	if s.running {
		return
	}

	s.running = true
	ticker := time.NewTicker(s.interval)

	go func() {
		log.Printf("Starting Git sync service (interval: %v)", s.interval)

		for {
			select {
			case <-ticker.C:
				if err := s.sync(); err != nil {
					log.Printf("Sync failed: %v", err)
				}
			case <-s.stop:
				ticker.Stop()
				s.running = false
				log.Println("Git sync service stopped")
				return
			}
		}
	}()
}

func (s *SyncService) Stop() {
	if s.running {
		s.stop <- true
	}
}

func (s *SyncService) sync() error {
	// Pull latest changes
	if err := s.git.Pull(); err != nil {
		log.Printf("Warning: git pull failed: %v", err)
	}

	// Check for local changes
	hasChanges, err := s.git.HasChanges()
	if err != nil {
		return err
	}

	// If there are changes, commit and push
	if hasChanges {
		log.Println("Local changes detected, committing...")

		if err := s.git.Add([]string{"."}); err != nil {
			return err
		}

		if err := s.git.Commit("Auto-sync from GitLife"); err != nil {
			return err
		}

		if err := s.git.Push(); err != nil {
			return err
		}

		log.Println("Changes pushed successfully")
	}

	return nil
}

func (s *SyncService) SyncNow() error {
	return s.sync()
}
