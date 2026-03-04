package people

import "context"

type Repository interface {
	Create(ctx context.Context, in CreatePersonInput) (Person, error)
	List(ctx context.Context, filter ListFilter) ([]Person, error)
	GetByID(ctx context.Context, personID string) (Person, error)
	UpdateStatus(ctx context.Context, personID, status string) (Person, error)
}
