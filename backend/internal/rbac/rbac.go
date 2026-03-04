package rbac

import "strings"

type Role string

const (
	RoleAdmin     Role = "admin"
	RoleBackOffice     = "backoffice"
	RoleMember         = "member"
	RoleTalent         = "talent"
)

func ParseRole(v string) Role {
	s := strings.TrimSpace(strings.ToLower(v))
	r := Role(s)
	switch r {
	case RoleAdmin, RoleBackOffice, RoleMember, RoleTalent:
		return r
	default:
		return ""
	}
}

func HasAnyRole(current Role, allowed ...Role) bool {
	for _, r := range allowed {
		if current == r {
			return true
		}
	}
	return false
}
