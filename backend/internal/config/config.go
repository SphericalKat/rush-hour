package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/knadh/koanf/parsers/dotenv"
	"github.com/knadh/koanf/parsers/toml"
	"github.com/knadh/koanf/providers/env"
	"github.com/knadh/koanf/providers/file"
	"github.com/knadh/koanf/v2"
)

// Config holds configuration variables
type Config struct {
	Addr                    string `koanf:"addr"`
	TimetableDBPath         string `koanf:"timetable_db_path"`
	RedisURL                string `koanf:"redis_url"`
	TimetableUpdateInterval string `koanf:"timetable_update_interval"`
}

// UpdateInterval parses and returns TimetableUpdateInterval as a time.Duration.
func (c *Config) UpdateInterval() (time.Duration, error) {
	return time.ParseDuration(c.TimetableUpdateInterval)
}

// Load reads config cascading from lowest to highest priority:
// env vars < .env < config.toml. Missing files are silently skipped.
func Load() (*Config, error) {
	k := koanf.New(".")

	if err := k.Load(env.Provider("", ".", strings.ToLower), nil); err != nil {
		return nil, fmt.Errorf("load env: %w", err)
	}
	for _, src := range []struct {
		path   string
		parser koanf.Parser
	}{
		{".env", dotenv.Parser()},
		{"config.toml", toml.Parser()},
	} {
		if err := k.Load(file.Provider(src.path), src.parser); err != nil && !os.IsNotExist(err) {
			return nil, fmt.Errorf("load %s: %w", src.path, err)
		}
	}

	cfg := &Config{
		Addr:                    ":8080",
		RedisURL:                "localhost:6379",
		TimetableUpdateInterval: "1h",
	}
	if err := k.Unmarshal("", cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}

	if cfg.TimetableDBPath == "" {
		return nil, fmt.Errorf("timetable_db_path is required")
	}
	if _, err := cfg.UpdateInterval(); err != nil {
		return nil, fmt.Errorf("invalid timetable_update_interval %q: %w", cfg.TimetableUpdateInterval, err)
	}

	return cfg, nil
}
