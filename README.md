# Field People

Field People MVP implementation workspace.

## Current Status

This repository was bootstrapped from `PJ_PLAN.md` and `REQUIREMENTS.md`.
The initial implementation starts with:

- M1 design artifacts (`docs/`)
- Backend API skeleton (Go)
- Initial database schema/migration for core entities

## Structure

- `docs/`: architecture/design/ADR artifacts
- `backend/`: Go API skeleton and migrations
- `frontend/`: Next.js placeholder for upcoming implementation
- `apps/web/`: immediately runnable web demo (Node, no dependencies)

## Quick Start (Backend)

```bash
cd backend
go run ./cmd/api
```

Health endpoint:

```bash
curl http://localhost:8080/healthz
```

## Quick Start (Openable Demo)

```bash
cd apps/web
npm run dev
```

Open:

```text
http://localhost:3001
```
