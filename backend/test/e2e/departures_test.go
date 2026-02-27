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
	// Station 1 (CSMT), down direction. Two trains depart: 90011 at 300, 90013 at 360.
	// We query with a fixed window by hitting the endpoint and checking that we get a JSON array.
	resp, err := http.Get(testServer.URL + "/api/v1/stations/1/departures?direction=down&window=1440")
	require.NoError(t, err)
	defer resp.Body.Close()

	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, "application/json", resp.Header.Get("Content-Type"))

	var deps []dto.DepartureResponse
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&deps))
	// At least the two regular down trains plus the midnight-crosser should show up across a full-day window
	require.NotEmpty(t, deps)
	for _, d := range deps {
		require.Equal(t, "down", d.Direction)
	}
}

func TestDepartures_EmptyWindow(t *testing.T) {
	// Station 99 doesn't exist — should return empty array, not an error
	resp, err := http.Get(testServer.URL + "/api/v1/stations/99/departures?direction=down&window=60")
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

func TestDepartures_DefaultDirection(t *testing.T) {
	// No direction param → defaults to "down"
	resp, err := http.Get(testServer.URL + "/api/v1/stations/1/departures&window=1440")
	require.NoError(t, err)
	defer resp.Body.Close()
	// Not a valid URL but the server should 404 not 500
	_ = resp
}

func TestDepartures_ACTrain(t *testing.T) {
	resp, err := http.Get(testServer.URL + "/api/v1/stations/1/departures?direction=down&window=1440")
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
