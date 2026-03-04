package config

import (
	"os"
	"strings"
)

type Config struct {
	AppAddr string

	MatrixClientMode  string
	MatrixHomeserver  string
	MatrixAccessToken string
}

func Load() Config {
	return Config{
		AppAddr:           envOr("APP_ADDR", ":8080"),
		MatrixClientMode:  strings.ToLower(envOr("MATRIX_CLIENT_MODE", "stub")),
		MatrixHomeserver:  strings.TrimSpace(os.Getenv("MATRIX_HOMESERVER_URL")),
		MatrixAccessToken: strings.TrimSpace(os.Getenv("MATRIX_ACCESS_TOKEN")),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
