# GitLife

Sistema de produtividade pessoal para desenvolvedores usando Git como banco de dados.

## 📋 Funcionalidades

- **Reading List** - Lista de leitura com status (lido/não lido/lendo)
- **Tasks** - Gerenciamento de tarefas (em desenvolvimento)
- **TIL** - Today I Learned (em desenvolvimento)  
- **Watch List** - Lista de materiais para assistir (em desenvolvimento)

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
```

### 2. Gerencie sua Reading List

```bash
# Adicionar livro
gitlife reading add "Clean Code" --author="Robert Martin" --type=book --priority=high

# Listar itens
gitlife reading list
gitlife reading list --status=reading

# Iniciar leitura
gitlife reading start "Clean-Code-Robert-Martin"

# Atualizar progresso
gitlife reading progress "Clean-Code-Robert-Martin" 45 --page=150

# Finalizar
gitlife reading finish "Clean-Code-Robert-Martin" --rating=5 --review="Excelente!"
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