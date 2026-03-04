package audit

import (
	"context"
	"sync"
	"time"
)

type Entry struct {
	ActorUserID string         `json:"actor_user_id"`
	ActorRole   string         `json:"actor_role"`
	Action      string         `json:"action"`
	TargetType  string         `json:"target_type"`
	TargetID    string         `json:"target_id"`
	BeforeData  map[string]any `json:"before_data,omitempty"`
	AfterData   map[string]any `json:"after_data,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
}

type Logger interface {
	Write(ctx context.Context, e Entry) error
}

type InMemoryLogger struct {
	mu      sync.Mutex
	entries []Entry
}

func NewInMemoryLogger() *InMemoryLogger {
	return &InMemoryLogger{entries: make([]Entry, 0, 128)}
}

func (l *InMemoryLogger) Write(_ context.Context, e Entry) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	if e.CreatedAt.IsZero() {
		e.CreatedAt = time.Now().UTC()
	}
	l.entries = append(l.entries, e)
	return nil
}

func (l *InMemoryLogger) Snapshot() []Entry {
	l.mu.Lock()
	defer l.mu.Unlock()
	out := make([]Entry, len(l.entries))
	copy(out, l.entries)
	return out
}
