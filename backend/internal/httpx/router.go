package httpx

import (
	"encoding/json"
	"net/http"
	"time"

	"fieldpeople/backend/internal/audit"
	"fieldpeople/backend/internal/auth"
	"fieldpeople/backend/internal/matrix"
	"fieldpeople/backend/internal/people"
	"fieldpeople/backend/internal/rbac"
)

type Options struct {
	MatrixClient matrix.Client
}

func NewRouter() http.Handler {
	return NewRouterWithOptions(Options{})
}

func NewRouterWithOptions(opts Options) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"status": "ok", "time": time.Now().UTC().Format(time.RFC3339)})
	})

	peopleRepo := people.NewInMemoryRepository()
	auditLogger := audit.NewInMemoryLogger()
	peopleService := people.NewService(peopleRepo, auditLogger)
	peopleHandler := people.NewHandler(peopleService)
	roomRepo := matrix.NewInMemoryRepository(opts.MatrixClient)
	roomService := matrix.NewService(roomRepo, auditLogger)
	roomHandler := matrix.NewHandler(roomService)

	mux.Handle("GET /api/v1/people", withAuth(withRoles(peopleHandler.List, rbac.RoleAdmin, rbac.RoleBackOffice, rbac.RoleMember)))
	mux.Handle("POST /api/v1/people", withAuth(withRoles(peopleHandler.Create, rbac.RoleAdmin, rbac.RoleBackOffice)))
	mux.Handle("GET /api/v1/people/{personID}", withAuth(withRoles(peopleHandler.GetByID, rbac.RoleAdmin, rbac.RoleBackOffice, rbac.RoleMember, rbac.RoleTalent)))
	mux.Handle("PATCH /api/v1/people/{personID}/status", withAuth(withRoles(peopleHandler.UpdateStatus, rbac.RoleAdmin, rbac.RoleBackOffice)))
	mux.Handle("GET /api/v1/rooms", withAuth(withRoles(roomHandler.ListRooms, rbac.RoleAdmin, rbac.RoleBackOffice, rbac.RoleMember, rbac.RoleTalent)))
	mux.Handle("POST /api/v1/rooms", withAuth(withRoles(roomHandler.CreateRoom, rbac.RoleAdmin, rbac.RoleBackOffice, rbac.RoleMember)))
	mux.Handle("POST /api/v1/rooms/{roomID}/members/sync", withAuth(withRoles(roomHandler.SyncRoomMembers, rbac.RoleAdmin, rbac.RoleBackOffice, rbac.RoleMember)))
	mux.Handle("GET /api/v1/rooms/{roomID}/links", withAuth(withRoles(roomHandler.GetRoomLinks, rbac.RoleAdmin, rbac.RoleBackOffice, rbac.RoleMember, rbac.RoleTalent)))

	return mux
}

func withAuth(next http.HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role := rbac.ParseRole(r.Header.Get("X-Role"))
		if role == "" {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "missing or invalid role"})
			return
		}
		userID := r.Header.Get("X-User-ID")
		if userID == "" {
			userID = "dev-user"
		}
		r = r.WithContext(auth.WithPrincipal(r.Context(), userID, role))
		next(w, r)
	})
}

func withRoles(next http.HandlerFunc, allowed ...rbac.Role) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		role := auth.Role(r.Context())
		if !rbac.HasAnyRole(role, allowed...) {
			writeJSON(w, http.StatusForbidden, map[string]any{"error": "forbidden"})
			return
		}
		next(w, r)
	}
}

func writeJSON(w http.ResponseWriter, code int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}
