package matrix

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"sync"
	"time"
)

var ErrRoomNotFound = errors.New("room not found")

type InMemoryRepository struct {
	mu     sync.RWMutex
	rooms  map[string]Room
	client Client
}

func NewInMemoryRepository(client Client) *InMemoryRepository {
	if client == nil {
		client = NewStubClient()
	}
	return &InMemoryRepository{
		rooms:  map[string]Room{},
		client: client,
	}
}

func (r *InMemoryRepository) Create(ctx context.Context, in CreateRoomInput) (Room, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now().UTC()
	room := Room{
		RoomID:           ensureRoomID(strings.TrimSpace(in.RoomID)),
		Type:             RoomType(strings.TrimSpace(in.Type)),
		RelatedPersonID:  strings.TrimSpace(in.RelatedPersonID),
		RelatedProjectID: strings.TrimSpace(in.RelatedProjectID),
		MemberUserIDs:    dedupeStrings(in.MemberUserIDs),
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	resolvedRoomID, err := r.client.EnsureRoom(ctx, room)
	if err != nil {
		return Room{}, err
	}
	room.RoomID = ensureRoomID(resolvedRoomID)
	if err := r.client.SyncMembers(ctx, room.RoomID, room.MemberUserIDs); err != nil {
		return Room{}, err
	}
	r.rooms[room.RoomID] = room
	return room, nil
}

func (r *InMemoryRepository) List(_ context.Context, roomType string) ([]Room, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	filter := strings.TrimSpace(roomType)
	items := make([]Room, 0, len(r.rooms))
	for _, room := range r.rooms {
		if filter != "" && string(room.Type) != filter {
			continue
		}
		items = append(items, room)
	}
	return items, nil
}

func (r *InMemoryRepository) GetByID(_ context.Context, roomID string) (Room, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	room, ok := r.rooms[strings.TrimSpace(roomID)]
	if !ok {
		return Room{}, ErrRoomNotFound
	}
	return room, nil
}

func (r *InMemoryRepository) SyncMembers(ctx context.Context, roomID string, memberUserIDs []string) (Room, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	id := strings.TrimSpace(roomID)
	room, ok := r.rooms[id]
	if !ok {
		return Room{}, ErrRoomNotFound
	}
	room.MemberUserIDs = dedupeStrings(memberUserIDs)
	if err := r.client.SyncMembers(ctx, id, room.MemberUserIDs); err != nil {
		return Room{}, err
	}
	room.UpdatedAt = time.Now().UTC()
	r.rooms[id] = room
	return room, nil
}

func dedupeStrings(values []string) []string {
	clean := make([]string, 0, len(values))
	for _, v := range values {
		t := strings.TrimSpace(v)
		if t == "" {
			continue
		}
		if !slices.Contains(clean, t) {
			clean = append(clean, t)
		}
	}
	return clean
}

func ensureRoomID(roomID string) string {
	if strings.TrimSpace(roomID) != "" {
		return strings.TrimSpace(roomID)
	}
	return fmt.Sprintf("!local-%d:fieldpeople.local", time.Now().UTC().UnixNano())
}
