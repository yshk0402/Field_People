package matrix

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

func (s *Service) Create(ctx context.Context, actorUserID, actorRole string, in CreateRoomInput) (Room, error) {
	if err := validateCreateRoomInput(in); err != nil {
		return Room{}, err
	}
	room, err := s.repo.Create(ctx, in)
	if err != nil {
		return Room{}, err
	}
	_ = s.audit.Write(ctx, audit.Entry{
		ActorUserID: actorUserID,
		ActorRole:   actorRole,
		Action:      "room.create",
		TargetType:  "room",
		TargetID:    room.RoomID,
		AfterData: map[string]any{
			"type":    room.Type,
			"members": room.MemberUserIDs,
		},
	})
	return room, nil
}

func (s *Service) List(ctx context.Context, roomType string) ([]Room, error) {
	return s.repo.List(ctx, roomType)
}

func (s *Service) GetByID(ctx context.Context, roomID string) (Room, error) {
	if strings.TrimSpace(roomID) == "" {
		return Room{}, errors.New("room_id is required")
	}
	return s.repo.GetByID(ctx, roomID)
}

func (s *Service) SyncMembers(ctx context.Context, actorUserID, actorRole, roomID string, in SyncMembersInput) (Room, error) {
	if strings.TrimSpace(roomID) == "" {
		return Room{}, errors.New("room_id is required")
	}
	before, err := s.repo.GetByID(ctx, roomID)
	if err != nil {
		return Room{}, err
	}
	after, err := s.repo.SyncMembers(ctx, roomID, in.MemberUserIDs)
	if err != nil {
		return Room{}, err
	}
	_ = s.audit.Write(ctx, audit.Entry{
		ActorUserID: actorUserID,
		ActorRole:   actorRole,
		Action:      "room.sync_members",
		TargetType:  "room",
		TargetID:    roomID,
		BeforeData: map[string]any{
			"members": before.MemberUserIDs,
		},
		AfterData: map[string]any{
			"members": after.MemberUserIDs,
		},
	})
	return after, nil
}

func (s *Service) BuildLinks(roomID string) (map[string]string, error) {
	roomID = strings.TrimSpace(roomID)
	if roomID == "" {
		return nil, errors.New("room_id is required")
	}
	if _, err := s.repo.GetByID(context.Background(), roomID); err != nil {
		return nil, err
	}
	return map[string]string{
		"element_web":    BuildElementWebLink(roomID),
		"element_mobile": BuildElementMobileLink(roomID),
	}, nil
}

func validateCreateRoomInput(in CreateRoomInput) error {
	rt := RoomType(strings.TrimSpace(in.Type))
	switch rt {
	case RoomTypePerson, RoomTypeProject, RoomTypeCommunity:
	default:
		return fmt.Errorf("type %q is not supported", in.Type)
	}
	if rt == RoomTypePerson && strings.TrimSpace(in.RelatedPersonID) == "" {
		return errors.New("related_person_id is required for person_room")
	}
	if rt == RoomTypeProject && strings.TrimSpace(in.RelatedProjectID) == "" {
		return errors.New("related_project_id is required for project_room")
	}
	return nil
}
