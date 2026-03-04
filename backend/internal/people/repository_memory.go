package people

import (
	"context"
	"errors"
	"slices"
	"strings"
	"sync"
	"time"
)

var ErrNotFound = errors.New("person not found")

type InMemoryRepository struct {
	mu   sync.RWMutex
	data map[string]Person
}

func NewInMemoryRepository() *InMemoryRepository {
	return &InMemoryRepository{data: map[string]Person{}}
}

func (r *InMemoryRepository) Create(_ context.Context, in CreatePersonInput) (Person, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now().UTC()
	id := "person-" + now.Format("20060102150405.000000000")
	p := Person{
		PersonID:     id,
		Name:         strings.TrimSpace(in.Name),
		DisplayName:  strings.TrimSpace(in.DisplayName),
		Email:        strings.TrimSpace(strings.ToLower(in.Email)),
		Type:         strings.TrimSpace(strings.ToLower(in.Type)),
		Role:         strings.TrimSpace(strings.ToLower(in.Role)),
		Skills:       slices.Clone(in.Skills),
		Status:       "active",
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	r.data[id] = p
	return p, nil
}

func (r *InMemoryRepository) List(_ context.Context, filter ListFilter) ([]Person, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	q := strings.ToLower(strings.TrimSpace(filter.Q))
	typeFilter := strings.ToLower(strings.TrimSpace(filter.Type))
	roleFilter := strings.ToLower(strings.TrimSpace(filter.Role))
	statusFilter := strings.ToLower(strings.TrimSpace(filter.Status))

	res := make([]Person, 0, len(r.data))
	for _, p := range r.data {
		if typeFilter != "" && p.Type != typeFilter {
			continue
		}
		if roleFilter != "" && p.Role != roleFilter {
			continue
		}
		if statusFilter != "" && p.Status != statusFilter {
			continue
		}
		if q != "" {
			hay := strings.ToLower(p.Name + " " + p.DisplayName + " " + p.Email + " " + strings.Join(p.Skills, " "))
			if !strings.Contains(hay, q) {
				continue
			}
		}
		res = append(res, p)
	}
	return res, nil
}

func (r *InMemoryRepository) GetByID(_ context.Context, personID string) (Person, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	p, ok := r.data[personID]
	if !ok {
		return Person{}, ErrNotFound
	}
	return p, nil
}

func (r *InMemoryRepository) UpdateStatus(_ context.Context, personID, status string) (Person, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	p, ok := r.data[personID]
	if !ok {
		return Person{}, ErrNotFound
	}
	p.Status = status
	p.UpdatedAt = time.Now().UTC()
	r.data[personID] = p
	return p, nil
}
