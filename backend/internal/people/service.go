package people

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"fieldpeople/backend/internal/audit"
)

type Service struct {
	repo  Repository
	audit audit.Logger
}

func NewService(repo Repository, auditLogger audit.Logger) *Service {
	return &Service{repo: repo, audit: auditLogger}
}

func (s *Service) Create(ctx context.Context, actorUserID, actorRole string, in CreatePersonInput) (Person, error) {
	if err := validateCreateInput(in); err != nil {
		return Person{}, err
	}

	p, err := s.repo.Create(ctx, in)
	if err != nil {
		return Person{}, err
	}

	_ = s.audit.Write(ctx, audit.Entry{
		ActorUserID: actorUserID,
		ActorRole:   actorRole,
		Action:      "person.create",
		TargetType:  "person",
		TargetID:    p.PersonID,
		AfterData: map[string]any{
			"name":  p.Name,
			"email": p.Email,
			"role":  p.Role,
		},
	})

	return p, nil
}

func (s *Service) List(ctx context.Context, filter ListFilter) ([]Person, error) {
	return s.repo.List(ctx, filter)
}

func (s *Service) GetByID(ctx context.Context, personID string) (Person, error) {
	if strings.TrimSpace(personID) == "" {
		return Person{}, errors.New("person_id is required")
	}
	return s.repo.GetByID(ctx, personID)
}

func (s *Service) UpdateStatus(ctx context.Context, actorUserID, actorRole, personID, status string) (Person, error) {
	status = strings.ToLower(strings.TrimSpace(status))
	if status != "active" && status != "inactive" {
		return Person{}, errors.New("status must be active or inactive")
	}
	before, err := s.repo.GetByID(ctx, personID)
	if err != nil {
		return Person{}, err
	}
	after, err := s.repo.UpdateStatus(ctx, personID, status)
	if err != nil {
		return Person{}, err
	}
	_ = s.audit.Write(ctx, audit.Entry{
		ActorUserID: actorUserID,
		ActorRole:   actorRole,
		Action:      "person.update_status",
		TargetType:  "person",
		TargetID:    personID,
		BeforeData: map[string]any{
			"status": before.Status,
		},
		AfterData: map[string]any{
			"status": after.Status,
		},
	})
	return after, nil
}

func validateCreateInput(in CreatePersonInput) error {
	if strings.TrimSpace(in.Name) == "" {
		return errors.New("name is required")
	}
	if strings.TrimSpace(in.Email) == "" {
		return errors.New("email is required")
	}
	if strings.TrimSpace(in.Type) == "" {
		return errors.New("type is required")
	}
	if strings.TrimSpace(in.Role) == "" {
		return errors.New("role is required")
	}
	role := strings.ToLower(strings.TrimSpace(in.Role))
	switch role {
	case "admin", "backoffice", "member", "talent":
	default:
		return fmt.Errorf("role %q is not supported", in.Role)
	}
	t := strings.ToLower(strings.TrimSpace(in.Type))
	switch t {
	case "employee", "contractor", "partner":
	default:
		return fmt.Errorf("type %q is not supported", in.Type)
	}
	return nil
}
