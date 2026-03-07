package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
)

const (
	mobondBase       = "https://mobond.com/mtracker"
	allLiveTrainsURL = mobondBase + "/getalllivetrains"
	liveTrainInfoURL = mobondBase + "/getlivetraininfo"

	// Mimic the User-Agent that m-indicator sends from an Android device.
	androidUA = "Dalvik/2.1.0 (Linux; U; Android 14; SM-S928B Build/UP1A.231005.007);gzip"
)

type LiveHandler struct {
	client   *http.Client
	trainRepo train.Repository
}

func NewLive(trainRepo train.Repository) *LiveHandler {
	return &LiveHandler{
		client:    &http.Client{Timeout: 10 * time.Second},
		trainRepo: trainRepo,
	}
}

// postMobond sends a POST to a mobond endpoint with form-encoded body and
// the same User-Agent that the m-indicator app uses. Go's default transport
// handles Accept-Encoding/gzip transparently — we must NOT set it explicitly
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

// GetLiveTrainInfo proxies the mobond getlivetraininfo endpoint for a single train.
func (h *LiveHandler) GetLiveTrainInfo(w http.ResponseWriter, r *http.Request) {
	trainNumber := chi.URLParam(r, "number")
	if trainNumber == "" {
		http.Error(w, "missing train number", http.StatusBadRequest)
		return
	}

	resp, err := h.postMobond(liveTrainInfoURL, "tn="+trainNumber)
	if err != nil {
		http.Error(w, "upstream error", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "read error", http.StatusBadGateway)
		return
	}

	if len(body) == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"live": false})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

// GetStops returns the ordered list of stops for a given train number.
func (h *LiveHandler) GetStops(w http.ResponseWriter, r *http.Request) {
	trainNumber := chi.URLParam(r, "number")
	if trainNumber == "" {
		http.Error(w, "missing train number", http.StatusBadRequest)
		return
	}

	stops, err := h.trainRepo.GetStops(r.Context(), trainNumber)
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

	resp := make([]stopResp, len(stops))
	for i, s := range stops {
		resp[i] = stopResp{
			Station:      s.Station,
			Departure:    s.Departure,
			StopSequence: s.StopSequence,
			Platform:     s.Platform,
			Side:         s.Side,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
