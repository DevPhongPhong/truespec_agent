package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

type Config struct {
	// HTTP listener port
	Port string `json:"port"`

	// Refresh interval in seconds
	RefreshIntervalSeconds int `json:"refresh_interval_seconds"`
}

// Load reads configuration from a JSON file
// Returns ErrConfigNotFound if the file doesn't exist
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrConfigNotFound
		}
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	// Set defaults if not provided
	if cfg.Port == "" {
		cfg.Port = ":9000"
	}
	if cfg.RefreshIntervalSeconds == 0 {
		cfg.RefreshIntervalSeconds = 300 // Default 5 minutes
	}

	return &cfg, nil
}

// Save writes configuration to a JSON file
func (c *Config) Save(path string) error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Ensure parent directory exists
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// GetRefreshInterval returns the refresh interval as time.Duration
func (c *Config) GetRefreshInterval() time.Duration {
	return time.Duration(c.RefreshIntervalSeconds) * time.Second
}
