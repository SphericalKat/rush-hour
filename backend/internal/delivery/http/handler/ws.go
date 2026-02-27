package handler

import (
	"log/slog"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/hub"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type WSHandler struct {
	hub *hub.Hub
}

func NewWS(h *hub.Hub) *WSHandler {
	return &WSHandler{hub: h}
}

func (h *WSHandler) Handle(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Warn("ws upgrade failed", "err", err)
		return
	}
	defer conn.Close()

	// First message must be a subscribe request.
	var msg struct {
		Type  string `json:"type"`
		Train string `json:"train"`
	}
	if err := conn.ReadJSON(&msg); err != nil || msg.Type != "subscribe" || msg.Train == "" {
		return
	}

	c := h.hub.Register(conn, msg.Train)
	defer h.hub.Unregister(c)

	// Read loop: keep the connection alive and detect disconnects.
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}
