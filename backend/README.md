# Field People Backend

Go API skeleton for Field People MVP.

## Implemented (current)

- Health check endpoint
- Auth context middleware (development header based)
- RBAC guard middleware
- People API (MVP subset)
  - `GET /api/v1/people`
  - `POST /api/v1/people`
  - `GET /api/v1/people/{personID}`
  - `PATCH /api/v1/people/{personID}/status`
- Matrix Room API (MVP skeleton)
  - `GET /api/v1/rooms`
  - `POST /api/v1/rooms`
  - `POST /api/v1/rooms/{roomID}/members/sync`
  - `GET /api/v1/rooms/{roomID}/links`
- Audit logging hook for person create/status update
  - + room create/member sync

## Request Headers (temporary for local dev)

- `X-Role`: `admin|backoffice|member|talent`
- `X-User-ID`: optional, defaults to `dev-user`

## Matrix Adapter Config

- `MATRIX_CLIENT_MODE`: `stub` (default) or `http`
- `MATRIX_HOMESERVER_URL`: required when `MATRIX_CLIENT_MODE=http`
- `MATRIX_ACCESS_TOKEN`: required when `MATRIX_CLIENT_MODE=http`

Notes:

- `stub`: no external Matrix API call (local development).
- `http`: uses Matrix Client-Server API for room create/invite skeleton.

## Next

- Replace header-based auth with Keycloak OIDC token verification (`T2-01`)
- Replace in-memory repository with PostgreSQL persistence (`T2-02`)
- Expose audit logs endpoint for QA/debug (`T2-09`)
