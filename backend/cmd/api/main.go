package main

import (
	"log"
	"net/http"

	"fieldpeople/backend/internal/config"
	"fieldpeople/backend/internal/httpx"
	"fieldpeople/backend/internal/matrix"
)

func main() {
	cfg := config.Load()
	matrixClient := buildMatrixClient(cfg)

	h := httpx.NewRouterWithOptions(httpx.Options{
		MatrixClient: matrixClient,
	})
	log.Printf("api listening on %s (matrix_client=%s)", cfg.AppAddr, matrixClient.Provider())
	if err := http.ListenAndServe(cfg.AppAddr, h); err != nil {
		log.Fatal(err)
	}
}

func buildMatrixClient(cfg config.Config) matrix.Client {
	switch cfg.MatrixClientMode {
	case "http":
		client, err := matrix.NewHTTPClient(cfg.MatrixHomeserver, cfg.MatrixAccessToken)
		if err != nil {
			log.Printf("matrix http client disabled (%v), fallback to stub", err)
			return matrix.NewStubClient()
		}
		return client
	default:
		return matrix.NewStubClient()
	}
}
