package matrix

import "context"

type StubClient struct{}

func NewStubClient() *StubClient {
	return &StubClient{}
}

func (c *StubClient) EnsureRoom(_ context.Context, room Room) (string, error) {
	return room.RoomID, nil
}

func (c *StubClient) SyncMembers(_ context.Context, _ string, _ []string) error {
	return nil
}

func (c *StubClient) Provider() string {
	return "stub"
}
