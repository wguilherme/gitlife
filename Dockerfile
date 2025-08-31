# Build stage
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o gitlife cmd/gitlife/main.go

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    git \
    openssh-client \
    ca-certificates \
    tzdata

# Create non-root user
RUN addgroup -g 1000 gitlife && \
    adduser -D -s /bin/sh -u 1000 -G gitlife gitlife

# Create necessary directories
RUN mkdir -p /home/gitlife/.ssh /data/vault && \
    chown -R gitlife:gitlife /home/gitlife /data

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/gitlife .
RUN chmod +x gitlife

# Switch to non-root user
USER gitlife

# Set default environment variables
ENV GITLIFE_VAULT_PATH=/data/vault \
    GITLIFE_SSH_KEY_PATH=/home/gitlife/.ssh/id_rsa

# Volume for vault data
VOLUME ["/data/vault"]

# Volume for SSH keys
VOLUME ["/home/gitlife/.ssh"]

ENTRYPOINT ["./gitlife"]
CMD ["--help"]