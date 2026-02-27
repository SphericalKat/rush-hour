package e2e_test

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestTimetableVersion_HashMatchesFile(t *testing.T) {
	// Compute expected hash of the temp timetable file.
	f, err := os.Open(testTimetable)
	require.NoError(t, err)
	defer f.Close()
	sum := sha256.New()
	_, err = io.Copy(sum, f)
	require.NoError(t, err)
	expected := hex.EncodeToString(sum.Sum(nil))

	resp, err := http.Get(testServer.URL + "/api/v1/timetable/version")
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)

	var body map[string]string
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
	require.Equal(t, expected, body["hash"])
	require.NotEmpty(t, body["updated_at"])
}

func TestTimetableDownload_StreamsFile(t *testing.T) {
	content, err := os.ReadFile(testTimetable)
	require.NoError(t, err)

	resp, err := http.Get(testServer.URL + "/api/v1/timetable/download")
	require.NoError(t, err)
	defer resp.Body.Close()
	require.Equal(t, http.StatusOK, resp.StatusCode)
	require.Equal(t, "application/octet-stream", resp.Header.Get("Content-Type"))

	got, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	require.Equal(t, content, got)
}
