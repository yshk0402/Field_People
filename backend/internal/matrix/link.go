package matrix

import (
	"fmt"
	"net/url"
	"strings"
)

func BuildElementWebLink(roomID string) string {
	escaped := url.QueryEscape(strings.TrimSpace(roomID))
	return fmt.Sprintf("https://app.element.io/#/room/%s", escaped)
}

func BuildElementMobileLink(roomID string) string {
	escaped := url.QueryEscape(strings.TrimSpace(roomID))
	return fmt.Sprintf("element://room/%s", escaped)
}
