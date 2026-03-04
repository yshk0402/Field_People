package matrix

import "context"

type Repository interface {
	Create(ctx context.Context, in CreateRoomInput) (Room, error)
	List(ctx context.Context, roomType string) ([]Room, error)
	GetByID(ctx context.Context, roomID string) (Room, error)
	SyncMembers(ctx context.Context, roomID string, memberUserIDs []string) (Room, error)
}
