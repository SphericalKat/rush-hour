package hub

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type         string `json:"type"`
	Train        string `json:"train"`
	DelayMinutes int    `json:"delay_minutes,omitempty"`
	Level        string `json:"level,omitempty"`
}

// Client represents a single WebSocket subscriber.
type Client struct {
	conn  *websocket.Conn
	train string
	send  chan []byte
}

// Hub manages subscriptions and broadcasts per train number.
type Hub struct {
	mu      sync.RWMutex
	clients map[string]map[*Client]struct{}
}

func New() *Hub {
	return &Hub{clients: make(map[string]map[*Client]struct{})}
}

func (h *Hub) Register(conn *websocket.Conn, trainNumber string) *Client {
	c := &Client{conn: conn, train: trainNumber, send: make(chan []byte, 16)}
	h.mu.Lock()
	if h.clients[trainNumber] == nil {
		h.clients[trainNumber] = make(map[*Client]struct{})
	}
	h.clients[trainNumber][c] = struct{}{}
	h.mu.Unlock()
	go c.writePump()
	return c
}

func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	if subs, ok := h.clients[c.train]; ok {
		delete(subs, c)
		if len(subs) == 0 {
			delete(h.clients, c.train)
		}
	}
	h.mu.Unlock()
	close(c.send)
}

func (h *Hub) Broadcast(msg Message) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for c := range h.clients[msg.Train] {
		select {
		case c.send <- data:
		default:
			// drop if the client's buffer is full
		}
	}
}

func (c *Client) writePump() {
	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}
