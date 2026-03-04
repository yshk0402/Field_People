# People API Draft (T2-02)

## Endpoints

### List

`GET /api/v1/people`

Query params:

- `q`: free text search on name/display_name/email/skills
- `type`: `employee|contractor|partner`
- `role`: `admin|backoffice|member|talent`
- `status`: `active|inactive`

Allowed roles: `admin`, `backoffice`, `member`

### Create

`POST /api/v1/people`

Body:

```json
{
  "name": "Jane Doe",
  "display_name": "Jane",
  "email": "jane@example.com",
  "type": "contractor",
  "role": "talent",
  "skills": ["go", "sql"]
}
```

Allowed roles: `admin`, `backoffice`

### Get by ID

`GET /api/v1/people/{personID}`

Allowed roles: `admin`, `backoffice`, `member`, `talent`

### Update status

`PATCH /api/v1/people/{personID}/status`

Body:

```json
{
  "status": "inactive"
}
```

Allowed roles: `admin`, `backoffice`

## Audit events

- `person.create`
- `person.update_status`

## Notes

- Current implementation uses in-memory store.
- Persistent storage migration is planned next.
