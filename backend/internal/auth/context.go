package auth

import (
	"context"

	"fieldpeople/backend/internal/rbac"
)

type contextKey string

const (
	userIDKey contextKey = "user_id"
	roleKey   contextKey = "role"
)

func WithPrincipal(ctx context.Context, userID string, role rbac.Role) context.Context {
	ctx = context.WithValue(ctx, userIDKey, userID)
	ctx = context.WithValue(ctx, roleKey, role)
	return ctx
}

func UserID(ctx context.Context) string {
	v, _ := ctx.Value(userIDKey).(string)
	return v
}

func Role(ctx context.Context) rbac.Role {
	v, _ := ctx.Value(roleKey).(rbac.Role)
	return v
}
