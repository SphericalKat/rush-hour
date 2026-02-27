package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/dto"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

type StatusHandler struct {
	uc *usecase.StatusUseCase
}

func NewStatus(uc *usecase.StatusUseCase) *StatusHandler {
	return &StatusHandler{uc: uc}
}

func (h *StatusHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	number := chi.URLParam(r, "number")

	status, err := h.uc.GetTrainStatus(r.Context(), number)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dto.TrainStatusResponse{
		TrainNumber:   status.TrainNumber,
		DelayMinutes:  status.DelayMinutes,
		ReporterCount: status.ReporterCount,
	})
}
