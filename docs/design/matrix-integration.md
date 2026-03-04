# Matrix Integration Design (T1-05)

Status: In Progress
Date: 2026-03-05

## Goal

- Use Matrix as chat backbone.
- Users chat mainly via Element clients (Web + Mobile).
- Field People manages room lifecycle, membership sync, and access revocation.

## Scope (MVP)

- Create room metadata in Field People and bind to domain entities.
- Sync room members from project/person assignment changes.
- Provide deep links to open corresponding room in Element.

## Out of Scope (MVP)

- Implementing full chat timeline UI in Field People.
- Rich Matrix admin automation beyond room/member lifecycle.

## Room Types

- `person_room`: 1 person centered operational room.
- `project_room`: project collaboration room.
- `community_room`: shared org/community room.

## API Draft (implemented skeleton)

- `GET /api/v1/rooms?type=`
- `POST /api/v1/rooms`
- `POST /api/v1/rooms/{roomID}/members/sync`
- `GET /api/v1/rooms/{roomID}/links`

## Adapter Strategy

- Matrix integration is abstracted by `matrix.Client`.
- Modes:
  - `stub`: local/test mode with no external dependency.
  - `http`: Matrix Client-Server API call mode (`createRoom`, `invite`).
- Runtime selection uses environment variables:
  - `MATRIX_CLIENT_MODE`
  - `MATRIX_HOMESERVER_URL`
  - `MATRIX_ACCESS_TOKEN`

### Link response

Returns two links:

- `element_web`: `https://app.element.io/#/room/{roomId}`
- `element_mobile`: `element://room/{roomId}`

## RBAC

- List/links: `admin`, `backoffice`, `member`, `talent`
- Create/sync: `admin`, `backoffice`, `member`

## Audit events

- `room.create`
- `room.sync_members`

## Open items

- Matrix homeserver target: {{TODO: 未確定（自前Synapse / Element Cloud / 既存Matrix）}}
- Service account operation policy: {{TODO: 未確定}}
- Membership sync trigger source: {{TODO: 未確定（event-driven / batch）}}
