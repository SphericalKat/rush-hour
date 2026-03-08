package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/routes"
)

const (
	mobondBase       = "https://mobond.com/mtracker"
	allLiveTrainsURL = mobondBase + "/getalllivetrains"
	liveTrainInfoURL = mobondBase + "/getlivetraininfo"

	// Mimic the User-Agent that m-indicator sends from an Android device.
	androidUA = "Dalvik/2.1.0 (Linux; U; Android 14; SM-S928B Build/UP1A.231005.007);gzip"
)

type LiveHandler struct {
	client    *http.Client
	trainRepo train.Repository
	redis     *redis.Client
}

func NewLive(trainRepo train.Repository, rc *redis.Client) *LiveHandler {
	return &LiveHandler{
		client:    &http.Client{Timeout: 10 * time.Second},
		trainRepo: trainRepo,
		redis:     rc,
	}
}

// postMobond sends a POST to a mobond endpoint with form-encoded body and
// the same User-Agent that the m-indicator app uses. Go's default transport
// handles Accept-Encoding/gzip transparently so we must NOT set it explicitly
// or Go won't auto-decompress the response.
func (h *LiveHandler) postMobond(url string, form string) (*http.Response, error) {
	req, err := http.NewRequest("POST", url, strings.NewReader(form))
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", androidUA)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return h.client.Do(req)
}

// GetAllLiveTrains proxies the mobond getalllivetrains endpoint.
func (h *LiveHandler) GetAllLiveTrains(w http.ResponseWriter, r *http.Request) {
	resp, err := h.postMobond(allLiveTrainsURL, "")
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	io.Copy(w, resp.Body)
}

// GetLiveTrainInfo returns live position for a train by merging m-indicator
// upstream data with our own crowdsourced positions from Redis.
func (h *LiveHandler) GetLiveTrainInfo(w http.ResponseWriter, r *http.Request) {
	trainNumber := chi.URLParam(r, "number")
	if trainNumber == "" {
		http.Error(w, "missing train number", http.StatusBadRequest)
		return
	}

	// Fetch m-indicator data
	var mobondData map[string]any
	resp, err := h.postMobond(liveTrainInfoURL, "tn="+trainNumber)
	if err == nil {
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		if len(body) > 0 {
			json.Unmarshal(body, &mobondData)
		}
	}

	// Fetch our own crowdsourced data
	ourData := GetOurPosition(r.Context(), h.redis, trainNumber)

	// Merge: prefer m-indicator if available (larger user base, more accurate),
	// fall back to our data, combine people counts
	result := h.mergePositions(mobondData, ourData)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (h *LiveHandler) mergePositions(mobond, ours map[string]any) any {
	hasMobond := mobond != nil && mobond["position"] != nil
	hasOurs := ours != nil && ours["position"] != nil

	if !hasMobond && !hasOurs {
		return map[string]any{"live": false}
	}

	if hasMobond && !hasOurs {
		return mobond
	}

	if !hasMobond && hasOurs {
		return ours
	}

	// Both available: use upstream position (larger crowd) but add our people count
	mobondPC, _ := mobond["pc"].(float64)
	oursPC, _ := ours["pc"].(float64)
	mobond["pc"] = int(mobondPC) + int(oursPC)
	return mobond
}

// GetStops returns the ordered list of stops for a given train number.
func (h *LiveHandler) GetStops(w http.ResponseWriter, r *http.Request) {
	trainNumber := chi.URLParam(r, "number")
	if trainNumber == "" {
		http.Error(w, "missing train number", http.StatusBadRequest)
		return
	}

	line := r.URL.Query().Get("line")
	stops, err := h.trainRepo.GetStops(r.Context(), trainNumber, line)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	type stopResp struct {
		Station      string `json:"station"`
		Departure    int    `json:"departure"`
		StopSequence int    `json:"stop_sequence"`
		Platform     string `json:"platform"`
		Side         string `json:"side"`
	}

	out := make([]stopResp, len(stops))
	for i, s := range stops {
		out[i] = stopResp{
			Station:      s.Station,
			Departure:    s.Departure,
			StopSequence: s.StopSequence,
			Platform:     s.Platform,
			Side:         s.Side,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}

// GetRoute returns the train's stops interleaved with non-stopping (pass-through)
// stations between consecutive actual stops. Uses the hardcoded physical station
// sequences from the routes package (matching m-indicator's bb.a.b method).
func (h *LiveHandler) GetRoute(w http.ResponseWriter, r *http.Request) {
	trainNumber := chi.URLParam(r, "number")
	if trainNumber == "" {
		http.Error(w, "missing train number", http.StatusBadRequest)
		return
	}

	line := r.URL.Query().Get("line")
	stops, err := h.trainRepo.GetStops(r.Context(), trainNumber, line)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	if len(stops) == 0 {
		http.Error(w, "unknown train", http.StatusNotFound)
		return
	}

	type routeStop struct {
		Station      string `json:"station"`
		Departure    int    `json:"departure,omitempty"`
		StopSequence int    `json:"stop_sequence"`
		Platform     string `json:"platform,omitempty"`
		Side         string `json:"side,omitempty"`
		IsStop       bool   `json:"is_stop"`
	}

	var route []routeStop
	seq := 0

	for i, s := range stops {
		route = append(route, routeStop{
			Station:      s.Station,
			Departure:    s.Departure,
			StopSequence: seq,
			Platform:     s.Platform,
			Side:         s.Side,
			IsStop:       true,
		})
		seq++

		// Insert pass-through stations between consecutive stops
		if i < len(stops)-1 {
			between := routes.StationsBetween(s.Station, stops[i+1].Station)
			for _, name := range between {
				route = append(route, routeStop{
					Station:      name,
					StopSequence: seq,
					IsStop:       false,
				})
				seq++
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(route)
}
