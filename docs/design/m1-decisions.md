# M1 Decision Log (Initial)

This file captures initial M1 decisions and unresolved items based on `PJ_PLAN.md`.

## T1-02 Logical Data Model

Status: In Progress

Entities (MVP + related):

- Person
- Contract
- Project
- Invoice
- Timesheet
- Task
- Room
- AuditLog

Notes:

- Initial relational model is defined in `backend/migrations/0001_init.sql`.
- JSONB is used for flexible attributes like `skills` and `metadata`.

## T1-03 RBAC Strategy

Status: In Progress

Decision:

- Start with `simple role only` for MVP (`admin`, `backoffice`, `member`, `talent`).
- Keep extension point for `role+permission` via policy map in application layer.

Rationale:

- Fastest path to unblock T2-01/T2-02.

## T1-04 Keycloak Sync Strategy

Status: Not Started

- {{TODO: 未確定（OIDC claims / SCIM / 定期同期）}}

Interim implementation:

- API supports reading role from request header for local development.

## T1-05 Matrix Integration Strategy

Status: In Progress

- {{TODO: 未確定（自前Synapse / Element Cloud / 既存Matrix）}}
- Client assumption (fixed): Element clients (Web + Mobile apps)
- Field People scope for MVP: room lifecycle, membership sync, access revocation, and deep-link handoff to Element
- API skeleton and detailed notes: `docs/design/matrix-integration.md`
- Integration adapter added: `stub/http` selectable client with env-based switching

## T1-06 Notification Infrastructure

Status: Not Started

- {{TODO: 未確定（Go job / cron / queue+worker）}}

## T1-07 Invoice Template

Status: Not Started

- {{TODO: 未確定（固定フォーム / カスタム項目）}}
