package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"
)

type TimetableHandler struct {
	dbPath   string
	mu       sync.RWMutex
	hash     string
	modTime  time.Time
}

func NewTimetable(dbPath string, updateInterval time.Duration) *TimetableHandler {
	h := &TimetableHandler{dbPath: dbPath}
	if err := h.refresh(); err != nil {
		slog.Warn("initial timetable hash failed", "err", err)
	}
	go func() {
		t := time.NewTicker(updateInterval)
		defer t.Stop()
		for range t.C {
			if err := h.refresh(); err != nil {
				slog.Warn("timetable refresh failed", "err", err)
			}
		}
	}()
	return h
}

func (h *TimetableHandler) refresh() error {
	f, err := os.Open(h.dbPath)
	if err != nil {
		return err
	}
	defer f.Close()

	fi, err := f.Stat()
	if err != nil {
		return err
	}

	sum := sha256.New()
	if _, err := io.Copy(sum, f); err != nil {
		return err
	}
	hash := hex.EncodeToString(sum.Sum(nil))

	h.mu.Lock()
	h.hash = hash
	h.modTime = fi.ModTime()
	h.mu.Unlock()
	return nil
}

func (h *TimetableHandler) GetVersion(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	hash := h.hash
	modTime := h.modTime
	h.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"hash":       hash,
		"updated_at": modTime.UTC().Format(time.RFC3339),
	})
}

func (h *TimetableHandler) Download(w http.ResponseWriter, r *http.Request) {
	f, err := os.Open(h.dbPath)
	if err != nil {
		http.Error(w, "timetable not available", http.StatusServiceUnavailable)
		return
	}
	defer f.Close()

	fi, err := f.Stat()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", `attachment; filename="timetable.db"`)
	http.ServeContent(w, r, "timetable.db", fi.ModTime(), f)
}
