#!/bin/bash
# Script para release local

set -e

VERSION=${1:-$(git describe --tags --always)}
echo "Creating release for version: $VERSION"

# Build com GoReleaser
export PATH=$PATH:$(go env GOPATH)/bin
goreleaser release --clean

echo ""
echo "✅ Release assets created in dist/"
echo ""
echo "📦 Manual upload to GitHub:"
echo "1. Go to: https://github.com/wguilherme/gitlife/releases/new"
echo "2. Tag: $VERSION"  
echo "3. Upload files from dist/:"
echo "   - gitlife_*.tar.gz"
echo "   - gitlife_*.zip"
echo "   - checksums.txt"
echo ""
echo "🐳 Docker build (optional):"
echo "docker build -t ghcr.io/wguilherme/gitlife:$VERSION ."
echo "docker push ghcr.io/wguilherme/gitlife:$VERSION"