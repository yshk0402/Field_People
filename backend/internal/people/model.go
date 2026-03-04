package people

import "time"

type Person struct {
	PersonID      string    `json:"person_id"`
	Name          string    `json:"name"`
	DisplayName   string    `json:"display_name,omitempty"`
	Email         string    `json:"email"`
	Type          string    `json:"type"`
	Role          string    `json:"role"`
	Skills        []string  `json:"skills,omitempty"`
	Availability  string    `json:"availability,omitempty"`
	Status        string    `json:"status"`
	ProjectCount  int       `json:"project_count,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreatePersonInput struct {
	Name        string   `json:"name"`
	DisplayName string   `json:"display_name"`
	Email       string   `json:"email"`
	Type        string   `json:"type"`
	Role        string   `json:"role"`
	Skills      []string `json:"skills"`
}

type UpdatePersonStatusInput struct {
	Status string `json:"status"`
}

type ListFilter struct {
	Q      string
	Type   string
	Role   string
	Status string
}
