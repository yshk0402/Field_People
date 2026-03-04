# Field People Web Demo

Lightweight runnable demo for local verification.

## Start

```bash
cd apps/web
npm run dev
```

Open:

- http://localhost:3001

## Role header model

Frontend sends:

- `x-role`: `admin|backoffice|member|talent`
- `x-user-id`: `demo-user`

## Covered APIs

- `GET /healthz`
- `GET /api/v1/people`
- `POST /api/v1/people`
- `GET /api/v1/rooms`
- `POST /api/v1/rooms`
- `POST /api/v1/rooms/{roomID}/members/sync`
- `GET /api/v1/rooms/{roomID}/links`
- `GET /api/v1/contracts`
- `POST /api/v1/contracts`
- `PATCH /api/v1/contracts/{contractID}/status`

## Note

This demo runs in-memory data store to make the project immediately openable.
