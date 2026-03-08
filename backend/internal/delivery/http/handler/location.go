package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

const locationTTL = 90 * time.Second

type LocationHandler struct {
	trainRepo train.Repository
	redis     *redis.Client
}

func NewLocation(trainRepo train.Repository, rc *redis.Client) *LocationHandler {
	return &LocationHandler{trainRepo: trainRepo, redis: rc}
}

type pushLocationReq struct {
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	DeviceID string  `json:"device_id"`
	Action   string  `json:"action"` // "start", "update", "stop"
}

type pushLocationResp struct {
	OK       bool   `json:"ok"`
	Station  string `json:"station,omitempty"`
	Status   string `json:"status,omitempty"`
	Msg      string `json:"msg,omitempty"`
	Accurate bool   `json:"accurate,omitempty"`
}

// PushLocation receives a GPS position from a user riding a train,
// resolves it to a station position, and stores it in Redis.
func (h *LocationHandler) PushLocation(w http.ResponseWriter, r *http.Request) {
	trainNumber := chi.URLParam(r, "number")
	if trainNumber == "" {
		http.Error(w, "missing train number", http.StatusBadRequest)
		return
	}

	var req pushLocationReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	if req.DeviceID == "" {
		http.Error(w, "missing device_id", http.StatusBadRequest)
		return
	}

	// Handle stop action: remove this device's share
	if req.Action == "stop" {
		h.redis.SRem(r.Context(), locationSharersKey(trainNumber), req.DeviceID)
		h.redis.Del(r.Context(), locationDeviceKey(trainNumber, req.DeviceID))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pushLocationResp{OK: true})
		return
	}

	// Use full line stations for accurate segment projection so fast trains
	// get a position even between stations they don't stop at.
	lineStops, err := h.trainRepo.GetLineStationsWithCoords(r.Context(), trainNumber)
	if err != nil || len(lineStops) == 0 {
		http.Error(w, "unknown train", http.StatusNotFound)
		return
	}

	pos := usecase.ResolvePosition(req.Lat, req.Lng, lineStops)
	if pos == nil {
		http.Error(w, "could not resolve position", http.StatusUnprocessableEntity)
		return
	}

	// Store in Redis: per-device position + set of active sharers
	posJSON, _ := json.Marshal(map[string]any{
		"msg": pos.Msg,
		"st":  pos.Status,
		"a":   pos.Accurate,
		"s":   pos.Station,
		"t":   time.Now().UnixMilli(),
	})

	pipe := h.redis.Pipeline()
	pipe.Set(r.Context(), locationDeviceKey(trainNumber, req.DeviceID), posJSON, locationTTL)
	pipe.SAdd(r.Context(), locationSharersKey(trainNumber), req.DeviceID)
	pipe.Expire(r.Context(), locationSharersKey(trainNumber), locationTTL)
	if _, err := pipe.Exec(r.Context()); err != nil {
		http.Error(w, "storage error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pushLocationResp{
		OK:       true,
		Station:  pos.Station,
		Status:   pos.Status,
		Msg:      pos.Msg,
		Accurate: pos.Accurate,
	})
}

// GetOurPosition returns our crowdsourced position for a train (merged from all sharers).
// Returns nil if no one is sharing.
func GetOurPosition(ctx context.Context, rc *redis.Client, trainNumber string) map[string]any {
	members, err := rc.SMembers(ctx, locationSharersKey(trainNumber)).Result()
	if err != nil || len(members) == 0 {
		return nil
	}

	// Find the most recent position across all sharers
	var bestPos map[string]any
	var bestTime int64

	for _, deviceID := range members {
		data, err := rc.Get(ctx, locationDeviceKey(trainNumber, deviceID)).Bytes()
		if err != nil {
			// Device TTL expired, clean up
			rc.SRem(ctx, locationSharersKey(trainNumber), deviceID)
			continue
		}
		var pos map[string]any
		if err := json.Unmarshal(data, &pos); err != nil {
			continue
		}
		t, _ := pos["t"].(float64)
		if int64(t) > bestTime {
			bestTime = int64(t)
			bestPos = pos
		}
	}

	if bestPos == nil {
		return nil
	}

	// Count active sharers
	count := len(members)
	return map[string]any{
		"pc": count,
		"t":  bestTime,
		"mv": true,
		"position": map[string]any{
			"msg": bestPos["msg"],
			"st":  bestPos["st"],
			"a":   bestPos["a"],
			"s":   bestPos["s"],
			"d":   0,
		},
		"source": "rush-hour",
	}
}

func locationSharersKey(trainNumber string) string {
	return fmt.Sprintf("loc:%s:sharers", trainNumber)
}

func locationDeviceKey(trainNumber, deviceID string) string {
	return fmt.Sprintf("loc:%s:dev:%s", trainNumber, deviceID)
}
