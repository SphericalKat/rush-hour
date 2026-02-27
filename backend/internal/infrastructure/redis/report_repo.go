package redis

import (
	"context"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/report"
)

// ttl matches trains' operational day; data is ephemeral and does not need to survive overnight.
const ttl = 4 * time.Hour

type reportRepo struct {
	client *redis.Client
}

func NewReportRepo(client *redis.Client) report.Repository {
	return &reportRepo{client: client}
}

func (r *reportRepo) SetDelay(ctx context.Context, rep report.DelayReport) error {
	return r.client.Set(ctx, delayKey(rep.TrainNumber), strconv.Itoa(rep.DelayMinutes), ttl).Err()
}

func (r *reportRepo) GetDelay(ctx context.Context, trainNumber string) (int, error) {
	val, err := r.client.Get(ctx, delayKey(trainNumber)).Result()
	if err == redis.Nil {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	return strconv.Atoi(val)
}

func (r *reportRepo) SetCount(ctx context.Context, rep report.CountReport) error {
	return r.client.Set(ctx, countKey(rep.TrainNumber, rep.StationID), string(rep.Level), ttl).Err()
}

func (r *reportRepo) GetCount(ctx context.Context, trainNumber, stationID string) (report.Level, error) {
	val, err := r.client.Get(ctx, countKey(trainNumber, stationID)).Result()
	if err == redis.Nil {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return report.Level(val), nil
}

func (r *reportRepo) AddReporter(ctx context.Context, trainNumber, deviceID string) error {
	key := reportersKey(trainNumber)
	pipe := r.client.Pipeline()
	pipe.PFAdd(ctx, key, deviceID)
	pipe.Expire(ctx, key, ttl)
	_, err := pipe.Exec(ctx)
	return err
}

func (r *reportRepo) CountReporters(ctx context.Context, trainNumber string) (int64, error) {
	return r.client.PFCount(ctx, reportersKey(trainNumber)).Result()
}
