package matrix

import (
	"encoding/json"
	"errors"
	"net/http"

	"fieldpeople/backend/internal/auth"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) ListRooms(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context(), r.URL.Query().Get("type"))
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to list rooms"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	var req CreateRoomInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json"})
		return
	}
	room, err := h.svc.Create(r.Context(), auth.UserID(r.Context()), string(auth.Role(r.Context())), req)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, room)
}

func (h *Handler) SyncRoomMembers(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")
	var req SyncMembersInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json"})
		return
	}
	room, err := h.svc.SyncMembers(r.Context(), auth.UserID(r.Context()), string(auth.Role(r.Context())), roomID, req)
	if err != nil {
		if errors.Is(err, ErrRoomNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "room not found"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, room)
}

func (h *Handler) GetRoomLinks(w http.ResponseWriter, r *http.Request) {
	roomID := r.PathValue("roomID")
	links, err := h.svc.BuildLinks(roomID)
	if err != nil {
		if errors.Is(err, ErrRoomNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "room not found"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"room_id": roomID,
		"links":   links,
	})
}

func writeJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}
