package usecase

import (
	"context"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/report"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/hub"
)

type ReportUseCase struct {
	reports report.Repository
	hub     *hub.Hub
}

func NewReport(reports report.Repository, h *hub.Hub) *ReportUseCase {
	return &ReportUseCase{reports: reports, hub: h}
}

func (uc *ReportUseCase) SubmitDelay(ctx context.Context, r report.DelayReport) error {
	if err := uc.reports.AddReporter(ctx, r.TrainNumber, r.DeviceID); err != nil {
		return err
	}
	if err := uc.reports.SetDelay(ctx, r); err != nil {
		return err
	}
	uc.hub.Broadcast(hub.Message{
		Type:         "delay",
		Train:        r.TrainNumber,
		DelayMinutes: r.DelayMinutes,
	})
	return nil
}

func (uc *ReportUseCase) SubmitCount(ctx context.Context, r report.CountReport) error {
	if err := uc.reports.AddReporter(ctx, r.TrainNumber, r.DeviceID); err != nil {
		return err
	}
	if err := uc.reports.SetCount(ctx, r); err != nil {
		return err
	}
	uc.hub.Broadcast(hub.Message{
		Type:  "count",
		Train: r.TrainNumber,
		Level: string(r.Level),
	})
	return nil
}
