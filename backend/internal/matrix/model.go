package matrix

import "time"

type RoomType string

const (
	RoomTypePerson    RoomType = "person_room"
	RoomTypeProject   RoomType = "project_room"
	RoomTypeCommunity RoomType = "community_room"
)

type Room struct {
	RoomID           string    `json:"room_id"`
	Type             RoomType  `json:"type"`
	RelatedPersonID  string    `json:"related_person_id,omitempty"`
	RelatedProjectID string    `json:"related_project_id,omitempty"`
	MemberUserIDs    []string  `json:"member_user_ids,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type CreateRoomInput struct {
	RoomID           string   `json:"room_id"`
	Type             string   `json:"type"`
	RelatedPersonID  string   `json:"related_person_id"`
	RelatedProjectID string   `json:"related_project_id"`
	MemberUserIDs    []string `json:"member_user_ids"`
}

type SyncMembersInput struct {
	MemberUserIDs []string `json:"member_user_ids"`
}
