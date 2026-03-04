# Field People Web Demo

Lightweight runnable demo for local verification.

## Start

```bash
cd apps/web
npm run dev
```

Open:

- http://localhost:3001

## Demo Authentication

- `POST /api/v1/auth/login` でトークンを発行
- 以降は `Authorization: Bearer <token>` で認証
- デモユーザー:
  - `admin@field.local / admin123`
  - `backoffice@field.local / backoffice123`
  - `member@field.local / member123`
  - `talent@field.local / talent123`

## Covered APIs

- `GET /healthz`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/invite`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/dashboard`
- `PATCH /api/v1/settings/profile`
- `PATCH /api/v1/settings/notifications`
- `GET /api/v1/people`
- `POST /api/v1/people`
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `POST /api/v1/projects/{projectID}/members`
- `GET /api/v1/rooms`
- `POST /api/v1/rooms`
- `POST /api/v1/rooms/{roomID}/members/sync`
- `GET /api/v1/rooms/{roomID}/links`
- `GET /api/v1/contracts`
- `POST /api/v1/contracts`
- `PATCH /api/v1/contracts/{contractID}/status`
- `GET /api/v1/invoices`
- `POST /api/v1/invoices`
- `PATCH /api/v1/invoices/{invoiceID}/status`

## Note

This demo runs in-memory data store to make the project immediately openable.
認証とRBACはMVPデモ向けの簡易実装で、Keycloak連携/JWT検証は backend 実装で置き換える前提です。
