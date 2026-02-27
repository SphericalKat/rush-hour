package redis

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

func NewClient(addr string) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{Addr: addr})
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("redis ping %s: %w", addr, err)
	}
	return client, nil
}

func delayKey(trainNumber string) string {
	return fmt.Sprintf("train:%s:delay", trainNumber)
}

func countKey(trainNumber, stationID string) string {
	return fmt.Sprintf("train:%s:count:%s", trainNumber, stationID)
}

func reportersKey(trainNumber string) string {
	return fmt.Sprintf("train:%s:reporters", trainNumber)
}
