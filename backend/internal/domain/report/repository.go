package report

import "context"

type Repository interface {
	SetDelay(ctx context.Context, r DelayReport) error
	GetDelay(ctx context.Context, trainNumber string) (int, error)
	SetCount(ctx context.Context, r CountReport) error
	GetCount(ctx context.Context, trainNumber, stationID string) (Level, error)
	AddReporter(ctx context.Context, trainNumber, deviceID string) error
	CountReporters(ctx context.Context, trainNumber string) (int64, error)
}
