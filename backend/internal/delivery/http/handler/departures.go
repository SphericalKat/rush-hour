package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/dto"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/station"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

type StationHandler struct {
	repo station.Repository
}

func NewStation(repo station.Repository) *StationHandler {
	return &StationHandler{repo: repo}
}

func (h *StationHandler) ListLines(w http.ResponseWriter, r *http.Request) {
	lines, err := h.repo.ListLines(r.Context())
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lines)
}

func (h *StationHandler) ListStations(w http.ResponseWriter, r *http.Request) {
	stations, err := h.repo.ListStations(r.Context())
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stations)
}

type DeparturesHandler struct {
	uc *usecase.DeparturesUseCase
}

func NewDepartures(uc *usecase.DeparturesUseCase) *DeparturesHandler {
	return &DeparturesHandler{uc: uc}
}

func (h *DeparturesHandler) GetDepartures(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid station id", http.StatusBadRequest)
		return
	}

	direction := r.URL.Query().Get("direction")
	if direction == "" {
		direction = "down"
	}

	window := 60
	if s := r.URL.Query().Get("window"); s != "" {
		if parsed, err := strconv.Atoi(s); err == nil && parsed > 0 {
			window = parsed
		}
	}

	now := time.Now()
	fromMinute := now.Hour()*60 + now.Minute()

	deps, err := h.uc.GetDepartures(r.Context(), id, direction, fromMinute, window)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	resp := make([]dto.DepartureResponse, len(deps))
	for i, d := range deps {
		resp[i] = dto.DepartureResponse{
			Number:      d.Number,
			Code:        d.Code,
			IsAC:        d.IsAC,
			Direction:   d.Direction,
			Line:        d.Line,
			Departure:   d.Departure,
			Station:     d.Station,
			Origin:      d.Origin,
			Destination: d.Destination,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
