package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/wguilherme/gitlife/internal/config"
	"github.com/wguilherme/gitlife/internal/infrastructure/http"
)

func main() {
	var port string
	flag.StringVar(&port, "port", "8080", "Port to run the server on")
	flag.Parse()

	// Load configuration from environment
	cfg := config.LoadFromEnv()

	// Create and start server
	server := http.NewServer(cfg, port)

	if err := server.Start(); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to start server: %v\n", err)
		log.Fatal(err)
	}
}
