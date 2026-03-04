package people

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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	items, err := h.svc.List(r.Context(), ListFilter{
		Q:      r.URL.Query().Get("q"),
		Type:   r.URL.Query().Get("type"),
		Role:   r.URL.Query().Get("role"),
		Status: r.URL.Query().Get("status"),
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "failed to list people"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreatePersonInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json"})
		return
	}

	created, err := h.svc.Create(r.Context(), auth.UserID(r.Context()), string(auth.Role(r.Context())), req)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	personID := r.PathValue("personID")
	p, err := h.svc.GetByID(r.Context(), personID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "person not found"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	personID := r.PathValue("personID")
	var req UpdatePersonStatusInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json"})
		return
	}

	p, err := h.svc.UpdateStatus(r.Context(), auth.UserID(r.Context()), string(auth.Role(r.Context())), personID, req.Status)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "person not found"})
			return
		}
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func writeJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}
