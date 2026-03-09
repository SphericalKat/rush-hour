package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/sphericalkat/rush-hour/backend/internal/config"
	server "github.com/sphericalkat/rush-hour/backend/internal/delivery/http"
	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/handler"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/hub"
	redisinf "github.com/sphericalkat/rush-hour/backend/internal/infrastructure/redis"
	sqliteinf "github.com/sphericalkat/rush-hour/backend/internal/infrastructure/sqlite"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("load config", "err", err)
		os.Exit(1)
	}

	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, syscall.SIGINT, syscall.SIGTERM)

	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup

	updateInterval, _ := cfg.UpdateInterval()

	db, err := sqliteinf.Open(cfg.TimetableDBPath)
	if err != nil {
		slog.Error("open sqlite", "err", err)
		os.Exit(1)
	}

	redisClient, err := redisinf.NewClient(cfg.RedisURL)
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

	timetableH := handler.NewTimetable(cfg.TimetableDBPath, updateInterval)

	r := server.NewRouter(stationRepo, trainRepo, redisClient, departuresUC, statusUC, reportUC, timetableH, wsHub)

	slog.Info("listening", "addr", cfg.Addr)
	go func(ctx context.Context) {
		wg.Add(1)
		server := &http.Server{Addr: cfg.Addr, Handler: r}
		if err := server.ListenAndServe(); err != nil {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
		<-ctx.Done()
		slog.Info("shutting down HTTP server")
		server.Shutdown(ctx)
		wg.Done()
	}(ctx)

	<-sigc
	slog.Info("shutting down services")
	cancel()
	slog.Info("all services shut down. GOOD-BYE!")
}
