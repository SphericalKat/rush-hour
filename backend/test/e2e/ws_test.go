package e2e_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/require"
)

func wsURL(path string) string {
	return "ws" + strings.TrimPrefix(testServer.URL, "http") + path
}

func TestWS_SubscribeAndReceiveDelay(t *testing.T) {
	conn, _, err := websocket.DefaultDialer.Dial(wsURL("/ws"), nil)
	require.NoError(t, err)
	defer conn.Close()

	// Subscribe to train 90011
	err = conn.WriteJSON(map[string]string{"type": "subscribe", "train": "90011"})
	require.NoError(t, err)

	// POST a delay report for 90011
	body, _ := json.Marshal(map[string]any{
		"train_number":  "90011",
		"delay_minutes": 4,
		"device_id":     "ws-test-device",
	})
	_, err = http.Post(testServer.URL+"/api/v1/reports/delay", "application/json", bytes.NewReader(body))
	require.NoError(t, err)

	// Expect a WS message within 2s
	conn.SetReadDeadline(time.Now().Add(2 * time.Second))
	_, msg, err := conn.ReadMessage()
	require.NoError(t, err)

	var received map[string]any
	require.NoError(t, json.Unmarshal(msg, &received))
	require.Equal(t, "delay", received["type"])
	require.Equal(t, "90011", received["train"])
	require.Equal(t, float64(4), received["delay_minutes"])
}

func TestWS_UnsubscribedClientDoesNotReceive(t *testing.T) {
	// Connect a client subscribed to 90013
	conn, _, err := websocket.DefaultDialer.Dial(wsURL("/ws"), nil)
	require.NoError(t, err)
	defer conn.Close()

	err = conn.WriteJSON(map[string]string{"type": "subscribe", "train": "90013"})
	require.NoError(t, err)

	// POST a delay for a different train (90012)
	body, _ := json.Marshal(map[string]any{
		"train_number":  "90012",
		"delay_minutes": 2,
		"device_id":     "ws-other-device",
	})
	_, err = http.Post(testServer.URL+"/api/v1/reports/delay", "application/json", bytes.NewReader(body))
	require.NoError(t, err)

	// The client subscribed to 90013 should not receive anything within 300ms
	conn.SetReadDeadline(time.Now().Add(300 * time.Millisecond))
	_, _, err = conn.ReadMessage()
	// Expect a deadline/timeout error, not a real message
	require.Error(t, err, "expected timeout — no message should arrive for unsubscribed train")
}

func TestWS_InvalidSubscribeMessage(t *testing.T) {
	conn, _, err := websocket.DefaultDialer.Dial(wsURL("/ws"), nil)
	require.NoError(t, err)
	defer conn.Close()

	// Send a non-subscribe message — server should close the connection
	err = conn.WriteJSON(map[string]string{"type": "ping"})
	require.NoError(t, err)

	conn.SetReadDeadline(time.Now().Add(500 * time.Millisecond))
	_, _, err = conn.ReadMessage()
	require.Error(t, err)
}
