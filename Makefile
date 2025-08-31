# GitLife Makefile
.PHONY: build test clean install dev release release-snapshot deps

# Build variables
BINARY_NAME=gitlife
VERSION?=$(shell git describe --tags --always --dirty)
COMMIT=$(shell git rev-parse HEAD)
DATE=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Go variables
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod

# Build flags
LDFLAGS=-ldflags "-s -w -X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE)"

# Default target
all: test build

# Build the binary
build:
	CGO_ENABLED=0 $(GOBUILD) $(LDFLAGS) -o $(BINARY_NAME) cmd/gitlife/main.go

# Build for all platforms (using goreleaser)
build-all:
	goreleaser build --snapshot --clean

# Run tests
test:
	$(GOTEST) -v ./...

# Run tests with coverage
test-coverage:
	$(GOTEST) -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -rf dist/
	rm -f coverage.out coverage.html

# Install dependencies
deps:
	$(GOMOD) download
	$(GOMOD) tidy

# Install binary locally
install: build
	sudo mv $(BINARY_NAME) /usr/local/bin/

# Development setup
dev: deps
	@echo "Setting up development environment..."
	@which goreleaser || go install github.com/goreleaser/goreleaser@latest
	@echo "Development environment ready!"

# Create a release (dry-run)
release-dry:
	goreleaser release --snapshot --clean

# Create a release snapshot
release-snapshot:
	goreleaser release --snapshot --clean

# Tag and release
release:
	@echo "Creating release $(VERSION)"
	@git tag -a $(VERSION) -m "Release $(VERSION)" || echo "Tag already exists"
	@git push origin $(VERSION)

# Create a new version tag
tag:
	@read -p "Enter version (e.g., v1.0.0): " version; \
	git tag -a $$version -m "Release $$version"; \
	git push origin $$version

# Run locally with environment
run:
	@source .env 2>/dev/null || true; ./$(BINARY_NAME) $(ARGS)

# Development commands
dev-vault-clone:
	@source .env && ./$(BINARY_NAME) vault clone $(REPO)

dev-reading-add:
	@source .env && ./$(BINARY_NAME) reading add $(TITLE) --author="$(AUTHOR)" --type=$(TYPE)

dev-reading-list:
	@source .env && ./$(BINARY_NAME) reading list

# Docker commands
docker-build:
	docker build -t gitlife:local .

docker-run:
	docker run --rm -it \
		-v ~/.ssh:/home/gitlife/.ssh:ro \
		-v $(PWD)/vault:/data/vault \
		-e GITLIFE_VAULT_REPO=$(GITLIFE_VAULT_REPO) \
		-e GITLIFE_SSH_KEY_PATH=/home/gitlife/.ssh/id_rsa \
		gitlife:local $(ARGS)

# Help
help:
	@echo "GitLife Development Commands:"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build           - Build binary for current platform"
	@echo "  make build-all       - Build for all platforms"
	@echo "  make install         - Install binary to /usr/local/bin"
	@echo ""
	@echo "Development:"
	@echo "  make dev             - Setup development environment"
	@echo "  make test            - Run tests"
	@echo "  make test-coverage   - Run tests with coverage"
	@echo "  make run ARGS='...'  - Run with local environment"
	@echo ""
	@echo "Release:"
	@echo "  make tag             - Create and push new version tag"
	@echo "  make release-dry     - Test release without publishing"
	@echo "  make release-snapshot- Create snapshot release"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build    - Build Docker image"
	@echo "  make docker-run ARGS='...' - Run in Docker container"
	@echo ""
	@echo "Vault:"
	@echo "  make dev-vault-clone REPO='git@github.com:user/repo.git'"
	@echo "  make dev-reading-add TITLE='Book' AUTHOR='Author' TYPE='book'"
	@echo "  make dev-reading-list"