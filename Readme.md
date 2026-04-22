# SmartSeason — Field Monitoring System

## Overview

SmartSeason is a simple full-stack web application for tracking crop progress across multiple fields during a growing season. It supports role-based access for Admins and Field Agents, enabling structured monitoring and reporting.

---

## Tech Stack

- **Frontend:** React  with Typescript(Vite)
- **Backend:** Node.js (Express)
- **Database:** PostgreSQL
- **Auth:** JWT (Access + Refresh Tokens)

---

## Architecture

Frontend (React)  
      ↓  
Backend (Node.js API)  
      ↓  
PostgreSQL  

---

## Setup

### Backend

```bash
cd backend
npm install
npm run migrate    # creates tables
npm run seed       # loads demo data
npm run dev        # runs on :4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # runs on :5173
```

### Environment Variables

Create a `backend/.env` file:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartseason
DATABASE_SSL=false
JWT_SECRET=change_me_in_production
REFRESH_SECRET=also_change_me_in_production
```

### Demo Credentials

| Role  | Email                       | Password |
|-------|-----------------------------|----------|
| Admin | <admin@smartseason.com>       | admin123 |
| Agent | <alice@smartseason.com>       | agent123 |
| Agent | <brian@smartseason.com>       | agent123 |

---

## API Overview

### Auth

- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

### Fields

- GET /fields
- POST /fields
- PATCH /fields/:id
- DELETE /fields/:id

### Observations

- POST /fields/:id/observations

---

## Status Logic

Status is computed at read-time from `current_stage` and the most recent observation timestamp. It is never stored in the database.

| Condition | Status |
|-----------|--------|
| Stage = `Harvested` | **Completed** |
| Stage = `Ready` or `Growing`, no observation in 7+ days | **At Risk** |
| Stage = `Planted`, 14+ days since planting, no observation in 7+ days | **At Risk** |
| Everything else | **Active** |

### Example

Field:

- Stage: Growing  
- Last observation: 10 days ago  

→ Status: **At Risk**

---

> Think of it like a smoke detector — it only fires when the crop is mature **and** no one has checked in recently.

---

## UI Preview

Admin Dashboard

![Admin Dashboard](./docs/admin-dashboard.jpg)

Add new field

![Field modal](./docs/field-modal.jpg)

Agent Dashboard

![Agent Dashboard](./docs/agent-dashboard.jpg)

Field card

![Field card](./docs/field-card.jpg)

---

## Design Decisions

### PostgreSQL for the DB

PostgreSQL was chosen because the relational model maps cleanly onto the field → agent → observation structure. Foreign key constraints, `SERIAL` primary keys, and `TIMESTAMPTZ` columns are enforced at the database level rather than in application code. This removes an entire class of data integrity bugs without any extra logic.

### Status computed on read, never stored

Storing a computed status column creates a synchronisation problem — it can silently drift out of date whenever an observation is added, deleted, or a stage is updated. Computing status fresh on every read costs one extra query per field but guarantees the value is always correct. No background job, no triggers, no cache invalidation.

### Role embedded in the JWT payload

The user's role is signed into the access token at login so that every subsequent API request can be authorised without hitting the database. The trade-off is that a role change — for example promoting an agent to admin — does not take effect until the user's next login. At the scale this system is designed for, that delay is acceptable. The alternative, a DB lookup on every request, would add latency and a failure point on every single call.

### Double role check: middleware and controller

The `auth` middleware verifies the JWT and attaches the user to the request. A second ownership check inside each controller confirms that the acting user is actually allowed to touch that specific resource — for example, that an agent is only updating a field assigned to them. This is defence in depth: neither layer trusts the other to have already caught the case.

### No ORM, no service layer

Direct SQL in the controllers keeps the codebase flat and readable. At this scale there is no meaningful benefit to abstracting queries behind a repository pattern or running them through an ORM. Every query is visible exactly where it is used, which makes tracing a bug a matter of reading one file rather than following a chain of abstractions.

### Observations are append-only

Agents can add observations but cannot edit or delete them. This is intentional — the observation log functions as an activity trail, and its value depends on it being tamper-proof. If an agent could rewrite a past note, the log would no longer be a reliable record of what actually happened in the field.

### One agent per field

Each field holds a single `assigned_agent_id`. Many-to-many assignment was considered and deliberately left out. The assessment scope calls for simplicity, and in practice a field monitoring system typically has a clear primary responsible agent. A join table can be introduced later without changing the existing schema.

---

## Authentication

The app uses a dual-token pattern: a short-lived access token for API calls and a long-lived refresh token for session continuity.

| Token | Expiry | Secret | Stored in DB |
|-------|--------|--------|--------------|
| Access token | 15 min | `JWT_SECRET` | No |
| Refresh token | 7 days | `REFRESH_SECRET` | Yes, in `refresh_tokens` |

### Why two secrets

`JWT_SECRET` and `REFRESH_SECRET` are intentionally separate. If the access token secret is ever compromised, refresh tokens remain safe because they are signed with a different key — and vice versa. A single shared secret means one leak breaks the entire auth system simultaneously.

### Refresh token rotation

Every time a refresh token is used, it is immediately revoked in the database and a brand new one is issued in the same response. A token can only ever be used once. If an attacker steals a refresh token and attempts to use it after the legitimate user already has, the token will be found in the database with `revoked = true` and the request will be rejected. The database is the ground truth — a valid JWT signature alone is not sufficient to proceed.

### Token refresh flow

```
1. Client sends refresh token  →  POST /auth/refresh
2. Server queries DB: token must exist AND revoked = false
3. Server verifies JWT signature with REFRESH_SECRET
4. Old token is revoked in DB immediately
5. New access token (15m) + new refresh token (7d) are issued
6. Client stores both and retries the original request
```

### Logout

Logout sets `revoked = true` on the refresh token in the database. The access token remains technically valid until its 15-minute expiry — this is the standard stateless JWT trade-off. For zero-tolerance revocation an access token blocklist (e.g. Redis) would be the logical next step, but that is out of scope here.

---

## Assumptions & Scope

**Email verification was not implemented** because this is an internal tool where user accounts are created directly by an admin. There is no public registration flow, so there is no untrusted email address that needs to be confirmed.

**Password reset was not built** because the system has no email transport configured. An admin can reset a password directly at the database level for now. Adding a reset flow would require wiring in an SMTP provider or a transactional email service, which is a separate infrastructure concern beyond the assessment scope.

**Pagination was left out** on the assumption that a single growing season involves a manageable number of fields — well within what a single database query and a client-side render can handle comfortably. When field counts grow, adding `LIMIT`/`OFFSET` query parameters to `GET /fields` is a small and non-breaking change.

**Hard deletes were used instead of soft deletes.** Deleting a field cascades to its observations. For a production system, soft deletes via a `deleted_at` timestamp would preserve audit history and allow recovery. For the assessment, the simpler behaviour was preferred over the additional complexity of filtering deleted records out of every query.

**Stage progression is not enforced at the database level.** An agent can move a field from `Planted` directly to `Harvested` if they choose to. The lifecycle order — `Planted → Growing → Ready → Harvested` — is a UI convention presented through the stage selector. Enforcing it strictly would require either a `CHECK` constraint comparing the new and old stage values or an application-level guard. Both add complexity that the assessment brief does not require.

**Token storage uses `localStorage` on the frontend.** This is a known trade-off. The more secure approach is to store the refresh token in an `httpOnly` cookie, which is inaccessible to JavaScript and therefore safe from XSS. `localStorage` was used here for simplicity, and the frontend does not yet implement an Axios response interceptor to auto-call `/auth/refresh` on a `401`. That interceptor — catch the `401`, call refresh, update storage, retry the original request — is the next logical addition to the frontend `api.ts` client.

**Role management has no UI.** Roles are assigned at seed time or directly in the database. Promoting a user from agent to admin is an admin-level database operation. A role management screen was considered out of scope given the brief's emphasis on simplicity over completeness.
