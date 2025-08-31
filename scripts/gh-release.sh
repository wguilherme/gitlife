#!/bin/bash
# Script para release usando GitHub CLI

set -e

if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI não encontrado. Instale com:"
    echo "brew install gh"
    exit 1
fi

VERSION=${1:-$(git describe --tags --always)}
echo "🚀 Creating GitHub release for version: $VERSION"

# Build assets
export PATH=$PATH:$(go env GOPATH)/bin
echo "📦 Building release assets..."
goreleaser release --snapshot --clean

# Create GitHub release
echo "🔼 Creating GitHub release..."
gh release create $VERSION \
    --title "GitLife $VERSION" \
    --notes "Release $VERSION - Personal productivity system for developers" \
    dist/*.tar.gz \
    dist/*.zip \
    dist/checksums.txt

echo "✅ Release created! View at:"
echo "https://github.com/wguilherme/gitlife/releases/tag/$VERSION"