package e2e_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/dto"
)

func postJSON(t *testing.T, url string, body any) *http.Response {
	t.Helper()
	b, err := json.Marshal(body)
	require.NoError(t, err)
	resp, err := http.Post(url, "application/json", bytes.NewReader(b))
	require.NoError(t, err)
	return resp
}

func TestSubmitDelay_ThenGetStatus(t *testing.T) {
	resp := postJSON(t, testServer.URL+"/api/v1/reports/delay", map[string]any{
		"train_number":  "90011",
		"delay_minutes": 7,
		"device_id":     "device-test-1",
	})
	defer resp.Body.Close()
	require.Equal(t, http.StatusNoContent, resp.StatusCode)

	statusResp, err := http.Get(testServer.URL + "/api/v1/trains/90011/status")
	require.NoError(t, err)
	defer statusResp.Body.Close()
	require.Equal(t, http.StatusOK, statusResp.StatusCode)

	var status dto.TrainStatusResponse
	require.NoError(t, json.NewDecoder(statusResp.Body).Decode(&status))
	require.Equal(t, "90011", status.TrainNumber)
	require.Equal(t, 7, status.DelayMinutes)
	require.GreaterOrEqual(t, status.ReporterCount, int64(1))
}

func TestSubmitDelay_DuplicateDeviceDedup(t *testing.T) {
	body := map[string]any{
		"train_number":  "90013",
		"delay_minutes": 3,
		"device_id":     "device-dedup",
	}

	r1 := postJSON(t, testServer.URL+"/api/v1/reports/delay", body)
	defer r1.Body.Close()
	require.Equal(t, http.StatusNoContent, r1.StatusCode)

	r2 := postJSON(t, testServer.URL+"/api/v1/reports/delay", body)
	defer r2.Body.Close()
	require.Equal(t, http.StatusNoContent, r2.StatusCode)

	statusResp, err := http.Get(testServer.URL + "/api/v1/trains/90013/status")
	require.NoError(t, err)
	defer statusResp.Body.Close()

	var status dto.TrainStatusResponse
	require.NoError(t, json.NewDecoder(statusResp.Body).Decode(&status))
	// HLL dedup: same device submitted twice → reporter_count should be 1
	require.Equal(t, int64(1), status.ReporterCount)
}

func TestSubmitCount_Persisted(t *testing.T) {
	resp := postJSON(t, testServer.URL+"/api/v1/reports/count", map[string]any{
		"train_number": "90011",
		"station_id":   "2",
		"level":        "crowded",
		"device_id":    "device-count-1",
	})
	defer resp.Body.Close()
	require.Equal(t, http.StatusNoContent, resp.StatusCode)
}

func TestSubmitDelay_MissingFields(t *testing.T) {
	resp := postJSON(t, testServer.URL+"/api/v1/reports/delay", map[string]any{
		"delay_minutes": 5,
	})
	defer resp.Body.Close()
	require.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestSubmitCount_InvalidLevel(t *testing.T) {
	resp := postJSON(t, testServer.URL+"/api/v1/reports/count", map[string]any{
		"train_number": "90011",
		"station_id":   "2",
		"level":        "packed", // not a valid level
		"device_id":    "dev1",
	})
	defer resp.Body.Close()
	require.Equal(t, http.StatusBadRequest, resp.StatusCode)
}
