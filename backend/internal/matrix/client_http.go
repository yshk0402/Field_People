package matrix

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type HTTPClient struct {
	homeserver string
	token      string
	httpClient *http.Client
}

func NewHTTPClient(homeserver, token string) (*HTTPClient, error) {
	h := strings.TrimSpace(homeserver)
	t := strings.TrimSpace(token)
	if h == "" {
		return nil, errors.New("matrix homeserver is required")
	}
	if t == "" {
		return nil, errors.New("matrix access token is required")
	}
	_, err := url.Parse(h)
	if err != nil {
		return nil, fmt.Errorf("invalid homeserver url: %w", err)
	}
	return &HTTPClient{
		homeserver: strings.TrimRight(h, "/"),
		token:      t,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}, nil
}

func (c *HTTPClient) EnsureRoom(ctx context.Context, room Room) (string, error) {
	roomID := strings.TrimSpace(room.RoomID)
	if roomID != "" {
		return roomID, nil
	}

	// Minimal create-room call for future Synapse/Element Cloud connection.
	payload := map[string]any{
		"name":    "Field People Room",
		"preset":  "private_chat",
		"is_direct": room.Type == RoomTypePerson,
	}
	var resp struct {
		RoomID string `json:"room_id"`
	}
	if err := c.postJSON(ctx, "/_matrix/client/v3/createRoom", payload, &resp); err != nil {
		return "", err
	}
	if strings.TrimSpace(resp.RoomID) == "" {
		return "", errors.New("matrix createRoom returned empty room_id")
	}
	return resp.RoomID, nil
}

func (c *HTTPClient) SyncMembers(ctx context.Context, roomID string, memberUserIDs []string) error {
	// Placeholder implementation: only supports invite operations now.
	for _, uid := range dedupeStrings(memberUserIDs) {
		if strings.TrimSpace(uid) == "" {
			continue
		}
		path := fmt.Sprintf("/_matrix/client/v3/rooms/%s/invite", url.PathEscape(roomID))
		payload := map[string]any{"user_id": uid}
		if err := c.postJSON(ctx, path, payload, nil); err != nil {
			return err
		}
	}
	return nil
}

func (c *HTTPClient) Provider() string {
	return "http"
}

func (c *HTTPClient) postJSON(ctx context.Context, path string, payload any, out any) error {
	buf, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.homeserver+path, bytes.NewReader(buf))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("matrix api error: status=%d", resp.StatusCode)
	}
	if out != nil {
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
			return err
		}
	}
	return nil
}
