package redis_test

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	goredis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"

	redisinf "github.com/sphericalkat/rush-hour/backend/internal/infrastructure/redis"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/report"
)

func newTestRepo(t *testing.T) (report.Repository, *miniredis.Miniredis) {
	t.Helper()
	mr, err := miniredis.Run()
	require.NoError(t, err)
	t.Cleanup(mr.Close)

	client := goredis.NewClient(&goredis.Options{Addr: mr.Addr()})
	t.Cleanup(func() { client.Close() })

	return redisinf.NewReportRepo(client), mr
}

func TestSetGetDelay(t *testing.T) {
	repo, _ := newTestRepo(t)
	ctx := context.Background()

	// No delay stored yet → 0
	delay, err := repo.GetDelay(ctx, "90001")
	require.NoError(t, err)
	require.Equal(t, 0, delay)

	err = repo.SetDelay(ctx, report.DelayReport{TrainNumber: "90001", DelayMinutes: 5, DeviceID: "dev1"})
	require.NoError(t, err)

	delay, err = repo.GetDelay(ctx, "90001")
	require.NoError(t, err)
	require.Equal(t, 5, delay)
}

func TestSetGetCount(t *testing.T) {
	repo, _ := newTestRepo(t)
	ctx := context.Background()

	level, err := repo.GetCount(ctx, "90001", "1")
	require.NoError(t, err)
	require.Equal(t, report.Level(""), level)

	err = repo.SetCount(ctx, report.CountReport{
		TrainNumber: "90001",
		StationID:   "1",
		Level:       report.LevelCrowded,
		DeviceID:    "dev1",
	})
	require.NoError(t, err)

	level, err = repo.GetCount(ctx, "90001", "1")
	require.NoError(t, err)
	require.Equal(t, report.LevelCrowded, level)
}

func TestHLLDedup(t *testing.T) {
	repo, _ := newTestRepo(t)
	ctx := context.Background()

	require.NoError(t, repo.AddReporter(ctx, "90001", "device-A"))
	require.NoError(t, repo.AddReporter(ctx, "90001", "device-A")) // duplicate, not counted again
	require.NoError(t, repo.AddReporter(ctx, "90001", "device-B"))

	count, err := repo.CountReporters(ctx, "90001")
	require.NoError(t, err)
	require.Equal(t, int64(2), count)
}

func TestTTLIsSet(t *testing.T) {
	repo, mr := newTestRepo(t)
	ctx := context.Background()

	err := repo.SetDelay(ctx, report.DelayReport{TrainNumber: "90001", DelayMinutes: 3, DeviceID: "dev1"})
	require.NoError(t, err)

	ttl := mr.TTL("train:90001:delay")
	require.Positive(t, ttl, "TTL should be set on delay key")
}
