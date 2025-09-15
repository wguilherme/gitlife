# GitLife - Personal Productivity System

## 📋 Project Overview

GitLife is a personal productivity system for developers that uses Git as a database and Markdown for data storage. It provides a reading list manager with both CLI and web interfaces.

## 🏗️ Architecture

### Backend (Go)
- **Domain-Driven Design (DDD)** architecture
- **Technology Stack**: Go 1.22, Gin HTTP framework
- **Storage**: Markdown files with Git versioning
- **API**: RESTful endpoints for reading list management

### Frontend (React + Electron)
- **Technology Stack**: React 18, TypeScript, Electron
- **Styling**: Tailwind CSS with dark/light themes
- **State Management**: React Query (@tanstack/react-query)
- **Architecture**: Domain-Driven Design (DDD) with clean layer separation

## 📁 Project Structure

```
gitlife/
├── cmd/
│   ├── gitlife/main.go           # CLI entry point
│   └── gitlife-server/main.go    # HTTP server entry point
├── internal/
│   ├── application/reading/      # Application services
│   ├── config/                   # Configuration management
│   ├── domain/reading/           # Domain models and interfaces
│   └── infrastructure/
│       ├── git/                  # Git service implementation
│       ├── http/                 # HTTP handlers and server
│       └── storage/              # Markdown repository implementation
├── ui/gitlife-ui/                # React + Electron frontend
│   └── src/
│       ├── application/          # DTOs and ports (DDD)
│       ├── domain/               # Domain entities (DDD)
│       ├── infrastructure/       # External services (DDD)
│       └── presentation/         # React components and UI
├── docker-compose.yml            # Development environment
├── Dockerfile.backend           # Go backend container
├── Makefile                     # Development commands
└── CLAUDE.md                    # This file
```

## 🚀 Development Environment

### Backend Commands (via Makefile)
- `make up` - Start backend API with Docker
- `make down` - Stop development environment  
- `make build` - Build CLI binary
- `make server` - Run HTTP server locally
- `make test` - Run tests
- `make dev-full` - Start complete environment (backend + frontend)

### Frontend Commands
- `cd ui/gitlife-ui && npm run start` - Start Electron app
- Located in `/ui/gitlife-ui/` directory

### Environment Variables (.env)
```bash
GITLIFE_VAULT_REPO=         # Git repository URL for data storage
GITLIFE_VAULT_PATH=./vault  # Local vault directory path
GITLIFE_SSH_KEY_PATH=       # SSH key for Git operations
GITLIFE_GIT_USER_NAME=      # Git commit author name
GITLIFE_GIT_USER_EMAIL=     # Git commit author email
GITLIFE_AUTO_SYNC=true      # Auto-sync with remote repository
GITLIFE_AUTO_COMMIT=true    # Auto-commit changes
GITLIFE_DEBUG=false         # Enable debug logging
```

## 🎯 Features Implemented

### CLI Interface
- ✅ Reading list management (add, list, start, progress, finish)
- ✅ Vault operations (init, clone, status, sync)
- ✅ Git integration with auto-sync
- ✅ Markdown-based data storage

### HTTP API (Port 8080)
- ✅ **Health**: `GET /health`
- ✅ **Reading**: 
  - `GET /api/reading` - List items with optional filters
  - `GET /api/reading/:id` - Get specific item
  - `POST /api/reading` - Add new item
  - `PUT /api/reading/:id/start` - Start reading
  - `PUT /api/reading/:id/progress` - Update progress
  - `PUT /api/reading/:id/finish` - Mark as finished
  - `DELETE /api/reading/:id` - Delete item
  - `GET /api/reading/stats` - Get statistics
- ✅ **Vault**:
  - `GET /api/vault/status` - Repository status
  - `POST /api/vault/init` - Initialize repository
  - `POST /api/vault/clone` - Clone repository
  - `POST /api/vault/sync` - Sync with remote

### Web Interface
- ✅ **LogSeq-style sidebar** with collapsible navigation
- ✅ **Kanban Board** with drag-and-drop functionality
- ✅ **Markdown View** with live editing
- ✅ **Global Search** (Ctrl+K) with fuzzy matching and history
- ✅ **Responsive design** (mobile + desktop)
- ✅ **Dark/Light theme** toggle
- ✅ **Real-time data** from Go API

## 📊 Data Model

### Reading Item
```typescript
interface ReadingItemDTO {
  id: string;              // Generated from title + author
  title: string;           // Book/article title
  author: string;          // Author name
  type: string;            // book, article, video, course
  status: 'to-read' | 'reading' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];          // Categorization tags
  progress?: number;       // Percentage (0-100)
  current_page?: number;   // Current page number
  rating?: number;         // 1-5 stars
  review?: string;         // User review/notes
  url?: string;           // External URL
  added?: string;         // ISO date when added
  started?: string;       // ISO date when started
  finished?: string;      // ISO date when finished
}
```

## 🔄 Git Integration

- **Storage**: All data stored as Markdown files in Git repository
- **Versioning**: Full history of all changes tracked
- **Sync**: Automatic push/pull with remote repository
- **SSH**: Secure authentication via SSH keys
- **Conflict Resolution**: Git-native merge handling

## 🛠️ Development Workflow

### Starting Development
1. `make up` - Start backend API
2. `cd ui/gitlife-ui && npm run start` - Start frontend
3. Or use `make dev-full` for automatic startup

### Testing API
- Backend runs on `http://localhost:8080`
- Health check: `curl http://localhost:8080/health`
- Reading API: `curl http://localhost:8080/api/reading`

### Frontend Development
- Electron app with hot-reload
- React DevTools available
- TypeScript compilation errors shown in terminal

## 🎨 UI Components

### Layout
- **Sidebar**: LogSeq-style navigation with collapse/expand
- **Header**: Contextual actions and breadcrumbs
- **Main Content**: Switchable views (Kanban/Markdown)

### Features
- **Search**: Global search with Ctrl+K hotkey
- **Drag & Drop**: Functional Kanban with status changes
- **Theming**: Consistent dark/light modes
- **Mobile**: Responsive sidebar overlay on mobile

## 📝 Recent Issues Fixed

1. ✅ **API Compatibility**: Fixed DTO mappings between Go backend and TypeScript frontend
2. ✅ **Status Alignment**: Changed 'finished' → 'done' for consistency
3. ✅ **Drag & Drop**: Fixed @dnd-kit implementation with proper collision detection
4. ✅ **Sidebar Navigation**: Implemented responsive layout with mobile overlay
5. ✅ **Search Functionality**: Added fuzzy search with keyboard navigation
6. 🔄 **Markdown Rendering**: Simplified processor to fix rendering errors

## 🔮 Next Steps

### Immediate Priorities
- [ ] Complete markdown rendering fix
- [ ] Add item creation/editing forms in UI
- [ ] Implement drag-and-drop status changes with API calls
- [ ] Add statistics dashboard

### Future Enhancements
- [ ] Notes management system
- [ ] Task/todo management
- [ ] Calendar integration
- [ ] Export/import functionality
- [ ] Plugin system for extensibility

## 🚨 Known Issues

1. **Markdown View**: Currently showing error - in progress fixing with simplified processor
2. **Mobile UX**: Drag-and-drop may need touch-specific improvements
3. **Error Boundaries**: Could benefit from React error boundaries for better UX

## 💡 Development Notes

- **DDD Architecture**: Both backend and frontend follow Domain-Driven Design patterns
- **Type Safety**: Full TypeScript coverage with strict mode enabled
- **API First**: All features built API-first for CLI/web compatibility  
- **Git Native**: Leverages Git's strengths for data versioning and sync
- **Developer Experience**: Hot-reload, comprehensive error handling, detailed logging

---

*This document is maintained to help Claude understand the project state and continue development efficiently.*