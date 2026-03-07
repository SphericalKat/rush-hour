package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	sqliteinf "github.com/sphericalkat/rush-hour/backend/internal/infrastructure/sqlite"

	redisinf "github.com/sphericalkat/rush-hour/backend/internal/infrastructure/redis"

	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/handler"
	server "github.com/sphericalkat/rush-hour/backend/internal/delivery/http"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/hub"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

func main() {
	addr := getEnv("ADDR", ":8080")
	dbPath := mustGetEnv("TIMETABLE_DB_PATH")
	redisAddr := getEnv("REDIS_URL", "localhost:6379")
	updateInterval := mustParseDuration(getEnv("TIMETABLE_UPDATE_INTERVAL", "1h"))

	db, err := sqliteinf.Open(dbPath)
	if err != nil {
		slog.Error("open sqlite", "err", err)
		os.Exit(1)
	}

	redisClient, err := redisinf.NewClient(redisAddr)
	if err != nil {
		slog.Error("connect redis", "err", err)
		os.Exit(1)
	}

	wsHub := hub.New()

	stationRepo := sqliteinf.NewStationRepo(db)
	trainRepo := sqliteinf.NewTrainRepo(db)
	reportRepo := redisinf.NewReportRepo(redisClient)

	departuresUC := usecase.NewDepartures(trainRepo, redisClient)
	statusUC := usecase.NewStatus(reportRepo)
	reportUC := usecase.NewReport(reportRepo, wsHub)

	timetableH := handler.NewTimetable(dbPath, updateInterval)

	r := server.NewRouter(stationRepo, departuresUC, statusUC, reportUC, timetableH, wsHub)

	slog.Info("listening", "addr", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		slog.Error("required env var not set", "key", key)
		os.Exit(1)
	}
	return v
}

func mustParseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		slog.Error("invalid duration", "value", s, "err", err)
		os.Exit(1)
	}
	return d
}
