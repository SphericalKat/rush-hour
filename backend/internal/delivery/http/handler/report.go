package handler

import (
	"encoding/json"
	"net/http"

	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/dto"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/report"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

type ReportHandler struct {
	uc *usecase.ReportUseCase
}

func NewReport(uc *usecase.ReportUseCase) *ReportHandler {
	return &ReportHandler{uc: uc}
}

func (h *ReportHandler) SubmitDelay(w http.ResponseWriter, r *http.Request) {
	var req dto.DelayReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.TrainNumber == "" || req.DeviceID == "" {
		http.Error(w, "train_number and device_id are required", http.StatusBadRequest)
		return
	}

	err := h.uc.SubmitDelay(r.Context(), report.DelayReport{
		TrainNumber:  req.TrainNumber,
		DelayMinutes: req.DelayMinutes,
		DeviceID:     req.DeviceID,
	})
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ReportHandler) SubmitCount(w http.ResponseWriter, r *http.Request) {
	var req dto.CountReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.TrainNumber == "" || req.DeviceID == "" || req.StationID == "" {
		http.Error(w, "train_number, station_id, and device_id are required", http.StatusBadRequest)
		return
	}

	level := report.Level(req.Level)
	switch level {
	case report.LevelLow, report.LevelModerate, report.LevelCrowded:
	default:
		http.Error(w, "level must be low, moderate, or crowded", http.StatusBadRequest)
		return
	}

	err := h.uc.SubmitCount(r.Context(), report.CountReport{
		TrainNumber: req.TrainNumber,
		StationID:   req.StationID,
		Level:       level,
		DeviceID:    req.DeviceID,
	})
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
