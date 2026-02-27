package usecase

import (
	"context"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/report"
)

type StatusUseCase struct {
	reports report.Repository
}

func NewStatus(reports report.Repository) *StatusUseCase {
	return &StatusUseCase{reports: reports}
}

func (uc *StatusUseCase) GetTrainStatus(ctx context.Context, trainNumber string) (*report.TrainStatus, error) {
	delay, err := uc.reports.GetDelay(ctx, trainNumber)
	if err != nil {
		return nil, err
	}
	count, err := uc.reports.CountReporters(ctx, trainNumber)
	if err != nil {
		return nil, err
	}
	return &report.TrainStatus{
		TrainNumber:   trainNumber,
		DelayMinutes:  delay,
		ReporterCount: count,
	}, nil
}
