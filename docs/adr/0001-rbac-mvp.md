# ADR-0001: MVP RBAC uses simple role model

- Status: Accepted (MVP)
- Date: 2026-03-05

## Context

PJ plan requires RBAC decision early (T1-03) to unblock authentication and feature APIs.

## Decision

Use a simple role model in MVP:

- `admin`
- `backoffice`
- `member`
- `talent`

Authorization is implemented as route-level guard and service-level checks.

## Consequences

Positive:

- Fast implementation and low operational complexity.

Negative:

- Less granular controls until permission model is added.

Follow-up:

- Add permission table/policy layer in post-MVP if required.
