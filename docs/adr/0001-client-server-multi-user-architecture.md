# ADR-0001: Client–server architecture for multi-user todo data

**Status:** Accepted  
**Date:** 2026-07-07  
**Deciders:** OC CS Speckit project (SDD kit; Todo example application)

## Context

The **Todo** example application shipped with OC CS Speckit is a **multi-user** todo app: each registered user owns private lists and items. No user may read or modify another user's data. The kit must be teachable as a Spec-Driven Development reference — clear boundaries between specification, frontend, backend, and tests.

We needed to decide:

1. Whether the browser holds authoritative state or only talks to a shared server.
2. How to identify the caller on every API request.
3. How to enforce per-user data isolation consistently across features.

A single-user or offline-first design (localStorage as source of truth, optional sync) would simplify the SPA but would not model real multi-tenant boundaries or shared MySQL persistence.

## Decision

Adopt a **classic client–server split** with a **stateless REST API** and **server-enforced user scoping**:

| Layer | Choice |
|-------|--------|
| **Client** | Vue 3 SPA (Vite), Vuetify 4, axios |
| **Server** | Node.js + Express + Sequelize (ES modules) |
| **Database** | MySQL — single shared database, rows scoped by `userId` |
| **Transport** | JSON over HTTPS; API base path `/todo/` |
| **Auth** | UniversityId + password; bcrypt hashes; **JWT + Session table** (token stored server-side, revocable on logout) |
| **Client session hint** | Login response stored in `localStorage` key `user`; axios attaches `Authorization: Bearer <token>` on every request |
| **Authorization** | `authenticate` middleware sets `req.user.id`; all list/todo queries filter by `userId`; create writes use `req.user.id`, never body; cross-user access returns **404** (not 403) |
| **Repo layout** | Monorepo: `frontend/` + `backend/` + `features/` specs |

```text
Browser (Vue SPA)                    Express API                 MySQL
─────────────────                    ───────────                 ─────
localStorage["user"]  ──Bearer──►   authenticate middleware  ──► sessions, users
router guards (UI)                   controllers + auth helpers    lists, todos
                                     userId in every WHERE clause
```

**Invariants** (must hold in every feature):

1. The server is the **source of truth** for lists, todos, and profile data.
2. Every authenticated request resolves to **exactly one** `req.user.id` from a valid session row.
3. **No endpoint** returns or mutates rows owned by another user.
4. The client never sends a trusted `userId` on create — the server assigns ownership.

## Consequences

### Positive

- Clear SDD layers: feature specs → API contract → implementation → Jest/Vitest proof.
- Realistic multi-user security model suitable for classroom and production-style review.
- Session revocation on logout (empty token on Session row) — not possible with JWT-only, client-only auth.
- Same patterns extend to Features 2–5 without re-deciding architecture.

### Negative / tradeoffs

- Requires a running MySQL instance and backend for full-stack work (not a static or offline demo).
- `localStorage` session is a **convenience cache** for UX (router guards, display name); it is not authoritative — 401 clears it and redirects to login.
- Per-user row scoping in SQL is simpler than org/team tenancy; multi-org would need a new ADR and schema work.
- CORS and two dev ports (`8082` frontend, `3200` backend) add local setup steps.

## Alternatives considered

| Option | Why not |
|--------|---------|
| **localStorage-only todos (no backend)** | No shared database, no real multi-user isolation, does not match courses API/testing goals. |
| **JWT in cookie only, no Session table** | Harder to revoke on logout; server cannot invalidate a stolen token without extra infrastructure. |
| **GraphQL or tRPC** | Heavier stack; REST + flat JSON matches existing rules and Agility export simplicity. |
| **403 Forbidden on cross-user IDs** | Leaks that a resource exists; **404** treats other users' rows as not found (see `security.mdc`). |
| **Server-rendered Vue (SSR)** | Out of scope for Vite SPA starter; auth still needs the same session model. |

## Related artifacts

- ADRs: [ADR-0002 — Layered security architecture](./0002-security-architecture.md), [ADR-0003 — MySQL relational database](./0003-mysql-relational-database.md), [ADR-0004 — Vue 3 as the frontend framework](./0004-vue-frontend-framework.md), [ADR-0006 — Node.js and Express as the API runtime](./0006-node-express-api.md), [ADR-0007 — REST and flat JSON](./0007-rest-json-api.md)
- C4 diagrams: [docs/arch_diagrams/](../arch_diagrams/README.md) (context, container, component)
- Feature specs: [Feature 1 — User Authentication](../../features/feature-1-user-auth.md) (identity foundation); Features 2–3 (list/todo isolation)
- Cursor rules: [auth-patterns.mdc](../../.cursor/rules/auth-patterns.mdc), [security.mdc](../../.cursor/rules/security.mdc), [frontend-services.mdc](../../.cursor/rules/frontend-services.mdc), [project-structure.mdc](../../.cursor/rules/project-structure.mdc)
- Reference: [api.md](../../features/reference/api.md), [data-model.md](../../features/reference/data-model.md)