package e2e_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/dto"
)

func TestDepartures_HappyPath(t *testing.T) {
	resp, err := http.Get(testServer.URL + "/api/v1/stations/1/departures")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, "application/json", resp.Header.Get("Content-Type"))

	var deps []dto.DepartureResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&deps))
	// All trains from CSMT (both directions) should be returned
	require.NotEmpty(t, deps)
}

func TestDepartures_NonexistentStation(t *testing.T) {
	resp, err := http.Get(testServer.URL + "/api/v1/stations/99/departures")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, http.StatusOK, resp.StatusCode)

	var deps []dto.DepartureResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&deps))
	require.Empty(t, deps)
}

func TestDepartures_InvalidStationID(t *testing.T) {
	resp, err := http.Get(testServer.URL + "/api/v1/stations/abc/departures")
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func TestDepartures_DestinationFilter(t *testing.T) {
	// Station 1 (CSMT), destination=3 (Thane).
	resp, err := http.Get(testServer.URL + "/api/v1/stations/1/departures?destination=3")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, http.StatusOK, resp.StatusCode)

	var deps []dto.DepartureResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&deps))
	require.NotEmpty(t, deps)

	// Filter by destination=5 (Borivali) — no CR trains go there, so should be empty.
	resp2, err := http.Get(testServer.URL + "/api/v1/stations/1/departures?destination=5")
	require.NoError(t, err)
	defer resp2.Body.Close()

	require.Equal(t, http.StatusOK, resp2.StatusCode)

	var deps2 []dto.DepartureResponse
	require.NoError(t, json.NewDecoder(resp2.Body).Decode(&deps2))
	require.Empty(t, deps2)
}

func TestDepartures_ACTrain(t *testing.T) {
	resp, err := http.Get(testServer.URL + "/api/v1/stations/1/departures")
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var deps []dto.DepartureResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&deps))

	var found bool
	for _, d := range deps {
		if d.Number == "90021" {
			require.True(t, d.IsAC, "train 90021 should be marked AC")
			found = true
		}
	}
	require.True(t, found, fmt.Sprintf("AC train 90021 not found in %+v", deps))
}
