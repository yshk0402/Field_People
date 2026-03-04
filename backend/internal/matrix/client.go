package matrix

import "context"

type Client interface {
	EnsureRoom(ctx context.Context, room Room) (string, error)
	SyncMembers(ctx context.Context, roomID string, memberUserIDs []string) error
	Provider() string
}
