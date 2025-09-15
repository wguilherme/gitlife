# GitLife

Sistema de produtividade pessoal para desenvolvedores usando Git como banco de dados.

## 📋 Funcionalidades

### ✅ Implementadas
- **Reading List** - Lista de leitura com status (to-read/reading/done)
- **Vault Management** - Gerenciamento de repositório Git para dados
- **CLI Interface** - Interface completa via linha de comando
- **HTTP API** - Servidor web com endpoints REST (porta 8080)
- **Web UI** - Interface React + Electron com Kanban board

### 🚧 Em Desenvolvimento
- **Tasks** - Gerenciamento de tarefas
- **TIL** - Today I Learned
- **Watch List** - Lista de materiais para assistir

## 🏗️ Arquitetura

- **Backend**: Go (Golang) com arquitetura DDD
- **Frontend**: CLI + Interface web (futuro)
- **Persistência**: Git (dados versionados em Markdown)
- **Deploy**: Kubernetes-ready com Docker

## 🚀 Instalação

### Download Binary (Recomendado)

```bash
# Linux/macOS
curl -L https://github.com/wguilherme/gitlife/releases/latest/download/gitlife_$(uname -s)_$(uname -m).tar.gz | tar xz
chmod +x gitlife
sudo mv gitlife /usr/local/bin/
```

### Usando Go

```bash
go install github.com/wguilherme/gitlife/cmd/gitlife@latest
```

### Docker

```bash
docker run --rm ghcr.io/wguilherme/gitlife:latest --help
```

## ⚡ Quick Start

### 1. Configure seu vault

```bash
# Clone repositório existente (ex: Obsidian)
gitlife vault clone git@github.com:user/vault.git

# OU initialize novo vault
gitlife vault init --remote=git@github.com:user/vault.git

# Verificar status do vault
gitlife vault status

# Sincronizar com repositório remoto
gitlife vault sync
```

### 2. Gerencie sua Reading List

```bash
# Adicionar livro
gitlife reading add "Clean Code" --author="Robert Martin" --type=book --priority=high --tags=programming,bestpractices

# Adicionar artigo com URL
gitlife reading add "Effective Go" --author="Go Team" --type=article --url="https://golang.org/doc/effective_go.html"

# Listar itens
gitlife reading list
gitlife reading list --status=reading
gitlife reading list --status=to-read
gitlife reading list --tag=programming

# Iniciar leitura (use o ID gerado)
gitlife reading start "Clean-Code-Robert-Martin"

# Atualizar progresso
gitlife reading progress "Clean-Code-Robert-Martin" 45 --page=150

# Finalizar com avaliação
gitlife reading finish "Clean-Code-Robert-Martin" --rating=5 --review="Excelente livro sobre clean code!"
```

### 3. Interface Web (Opcional)

```bash
# Iniciar servidor HTTP (porta 8080)
gitlife-server

# Em outro terminal, iniciar interface web
cd ui/gitlife-ui
npm install
npm run start
```

## 📖 Referência CLI

### Comandos do Vault

```bash
# Inicializar novo vault
gitlife vault init [--remote=URL]

# Clonar vault existente
gitlife vault clone <url>

# Verificar status do repositório
gitlife vault status

# Sincronizar com repositório remoto
gitlife vault sync
```

### Comandos da Reading List

#### Adicionar Item
```bash
gitlife reading add <título> [flags]

# Flags disponíveis:
--author string     # Nome do autor
--type string       # Tipo: book, article, video, course (padrão: book)
--priority string   # Prioridade: high, medium, low (padrão: medium)
--tags strings      # Tags separadas por vírgula
--url string        # URL do item
```

#### Listar Itens
```bash
gitlife reading list [flags]

# Flags disponíveis:
--status string     # Filtrar por status: to-read, reading, done
--tag string        # Filtrar por tag específica
```

#### Gerenciar Leitura
```bash
# Iniciar leitura
gitlife reading start <id>

# Atualizar progresso
gitlife reading progress <id> <porcentagem> [--page=número]

# Finalizar leitura
gitlife reading finish <id> [--rating=1-5] [--review="texto"]
```

### Flags Globais
```bash
--vault string      # Caminho para diretório do vault (padrão: "./vault")
--help             # Ajuda para qualquer comando
```

### Exemplos Práticos

```bash
# Configuração inicial
gitlife vault clone git@github.com:user/vault.git

# Adicionar diferentes tipos de conteúdo
gitlife reading add "Clean Architecture" --author="Robert Martin" --type=book --priority=high
gitlife reading add "React Documentation" --type=article --url="https://react.dev" --tags=frontend,react
gitlife reading add "Docker Tutorial" --type=video --tags=devops,containers

# Workflow de leitura
gitlife reading list --status=to-read
gitlife reading start "Clean-Architecture-Robert-Martin"
gitlife reading progress "Clean-Architecture-Robert-Martin" 30 --page=95
gitlife reading finish "Clean-Architecture-Robert-Martin" --rating=5 --review="Conceitos fundamentais de arquitetura"

# Filtros e consultas
gitlife reading list --tag=frontend
gitlife reading list --status=done
gitlife vault status
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Obrigatórias
GITLIFE_VAULT_REPO=git@github.com:user/vault.git
GITLIFE_SSH_KEY_PATH=/path/to/ssh/key

# Opcionais
GITLIFE_VAULT_PATH=./vault
GITLIFE_FOLDER=gitlife
GITLIFE_AUTO_SYNC=true
GITLIFE_AUTO_COMMIT=true
GITLIFE_GIT_USER_NAME="Seu Nome"
GITLIFE_GIT_USER_EMAIL=email@example.com
```

### Arquivo .env (Local)

```bash
cp .env.example .env
# Editar conforme necessário
```

## 🐳 Deploy Kubernetes

```bash
# Deploy completo
./k8s/deploy.sh

# OU manual
kubectl apply -f k8s/
```

## 🛠️ Desenvolvimento

### Setup

```bash
make dev
```

### Build

```bash
# Local
make build

# Todas as plataformas
make build-all
```

### Release

```bash
# Criar tag e release
make tag

# Test release
make release-dry
```

## 📁 Estrutura de Dados

O GitLife salva dados em Markdown dentro da pasta `gitlife/` do seu vault:

```
vault/
├── seus-arquivos-existentes/
└── gitlife/                    # Pasta isolada GitLife
    ├── reading.md              # Lista de leitura
    ├── tasks.md               # Tarefas (futuro)
    ├── til/                   # TIL diários (futuro)
    └── watch.md               # Watch list (futuro)
```

### Formato Reading List

```markdown
---
type: reading-list
---

# Reading List

## 📚 To Read

### [[Clean Code]]
- **type**: book
- **author**: Robert Martin
- **tags**: #programming #best-practices
- **priority**: high

## 📖 Reading

### [[Design Patterns]]
- **type**: book
- **author**: Gang of Four
- **progress**: 45%
- **current_page**: 150

## ✅ Done

### [[Effective Go]]
- **type**: article
- **author**: Go Team
- **rating**: ⭐⭐⭐⭐⭐
- **review**: Excelente material
```

## 🏭 Production

### Kubernetes

O GitLife é production-ready para Kubernetes:

- **SSH Authentication** via Secrets
- **Auto-sync** com repositório Git
- **Persistent storage** para cache Git
- **Health checks** configurados
- **Multi-arch Docker images**

### Environment Variables para Produção

```yaml
env:
- name: GITLIFE_VAULT_REPO
  value: "git@github.com:org/vault.git"
- name: GITLIFE_SSH_KEY_PATH
  value: "/secrets/ssh/id_rsa"
- name: GITLIFE_AUTO_SYNC
  value: "true"
```

## 📄 License

MIT