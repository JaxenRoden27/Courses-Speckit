# ADR-0002: Layered security architecture

**Status:** Accepted  
**Date:** 2026-07-07  
**Deciders:** OC CS Speckit project (SDD kit; Todo example application)

## Context

[ADR-0001](./0001-client-server-multi-user-architecture.md) establishes the client–server split and per-user data boundaries. Security still needed an explicit model for **where** trust is enforced, **how** sessions are validated, and **what** the application deliberately does not implement in v1.

Threats relevant to this app:

- User A accessing user B's lists, todos, or profile.
- Stolen or replayed session tokens after logout or expiry.
- Client tampering (`userId` in request body, ID enumeration).
- Credential disclosure (password hashes in API responses, weak storage).
- Relying on frontend-only checks (router guards, form validation) as security controls.

The security model must be teachable, testable via Gherkin scenarios, and consistent across Features 1–5 without re-deciding per endpoint.

## Decision

Adopt a **layered security architecture** with the **API as the sole enforcement point** and **defense in depth** on the client for UX only.

### Trust boundaries

```text
┌─────────────────────────────────────────────────────────────┐
│  Browser (untrusted)                                        │
│  • localStorage session hint                                │
│  • Router guards + Vuetify validation (UX only)             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + Authorization: Bearer
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Express API (trusted enforcement)                          │
│  1. authenticate middleware → req.user.id                   │
│  2. Controller validation → 400 on bad input                │
│  3. Authorization helpers → scope every read/write          │
│  4. Never return password hashes                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ Parameterized Sequelize queries
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MySQL (persistence)                                        │
│  • userId FK on lists/todos                                 │
│  • sessions table for revocable tokens                      │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1 — Authentication (who is calling?)

| Control | Implementation |
|---------|----------------|
| Credentials | universityId + password; universityId normalized `trim().toLowerCase()` |
| Password storage | bcryptjs, `SALT_ROUNDS = 10`; minimum 8 characters at registration/update |
| Session token | JWT signed with `AUTH_SECRET`; **also** stored in `sessions` table with `expirationDate` |
| Token lifetime | 24 hours |
| Request proof | `Authorization: Bearer <token>` on every protected route |
| Validation | `authenticate` middleware: token must exist in DB, not expired, joined to a user |
| Logout | Clear token on session row (server-side revocation) |
| Identity on request | `req.user = { id, role }` — controllers use `req.user.id` only |

**Hybrid JWT + Session table:** the JWT carries the token value; the database row is the revocation and expiry gate. Logout and expiry are enforceable without a token blacklist service.

### Layer 2 — Authorization (what may this user do?)

| Control | Implementation |
|---------|----------------|
| Row-level scope | Every list/todo query includes `userId: req.user.id` in the `WHERE` clause |
| Create ownership | Set `userId` from `req.user.id`; **ignore** client-supplied `userId` in body |
| Update/delete | Load via `getAccessibleListOrNull`, `getAccessibleTodoOrNull`, or `getAccessibleUserOrNull` |
| Cross-user access | Return **404** with a not-found message — never **403** (avoids confirming resource existence) |
| Profile access | User may only `GET`/`PUT` their own `userId`; `:id` must match `req.user.id` |
| Centralization | All scope checks live in `backend/app/authorization/` — controllers do not inline duplicate logic |

### Layer 3 — Client hardening (UX, not security)

| Control | Purpose |
|---------|---------|
| `router.beforeEach` | Redirect unauthenticated users away from protected routes |
| axios `transformRequest` | Attach Bearer token from `localStorage` |
| axios `transformResponse` | On 401, clear `user` and redirect to login |
| Vuetify form rules | Block invalid submits before network (email format, password length, required fields) |

**Rule:** passing a Vitest router test or skipping client validation must **not** grant access; Jest + supertest against the API is the security proof.

### Layer 4 — Secrets and configuration

| Secret / config | Location |
|---------------|----------|
| `AUTH_SECRET` | `backend/.env` — never committed |
| DB credentials | `backend/.env` / `backend/.env.test` |
| Password reset endpoint | Disabled when `NODE_ENV === "production"` |

### Roles (foundation only)

New users receive role `worker`. Middleware hooks (`requireAdmin`, `requireSuperAdmin`) exist for future admin features but are not used by current todo CRUD. Todo data is scoped by **user**, not role.

### Explicitly out of scope (v1)

Documented deferrals — not security holes by omission in the teaching model, but not implemented:

| Control | Status |
|---------|--------|
| Rate limiting / brute-force lockout | Out of scope |
| CSRF tokens | Not required for Bearer-header SPA API (no cookie session) |
| OAuth / social login | Out of scope (Feature 1) |
| Email verification / password reset flow | Out of scope |
| Field-level encryption at rest | Out of scope |
| Multi-org / tenant isolation | Future ADR if added |
| Content Security Policy / Helmet hardening | Recommended for production deploy; not spec-gated |

## Consequences

### Positive

- Single enforcement point (`authenticate` + authorization helpers) — easy to audit and test.
- Gherkin scenarios in Features 1–4 map directly to security behavior (401, 404, ownership).
- Revocable sessions without Redis or a dedicated token blacklist.
- 404-on-cross-user pattern reduces information leakage in a shared-database multi-user app.
- Centralized helpers prevent scope-check drift across controllers.

### Negative / tradeoffs

- Bearer token in `localStorage` is vulnerable to XSS — mitigated by framework defaults and no `v-html` on user content, but not as strong as HttpOnly cookies.
- No rate limiting leaves login open to online brute force in a public deployment.
- Per-user scoping does not scale to shared lists or teams without schema and ADR changes.
- Client and server both validate inputs — duplicate logic maintained deliberately (UX vs enforcement).

## Alternatives considered

| Option | Why not |
|--------|---------|
| **Frontend-only auth (router guard sufficient)** | Trivially bypassed via curl; fails constitution Principle 3. |
| **403 on cross-user ID** | Confirms resource exists to an attacker probing IDs. |
| **Trust `userId` from request body on create** | Client can assign rows to other users. |
| **JWT only (no Session table)** | Cannot revoke on logout without extra infrastructure. |
| **Cookie-based session without Bearer** | Complicates SPA CORS/dev setup; CSRF becomes mandatory. |
| **Inline scope checks per controller** | Duplication risk; already rejected in favor of `getAccessible*OrNull` helpers. |
| **RBAC for todo ownership** | Overkill; `worker` role + `userId` FK is sufficient for private todos. |

## Related artifacts

- ADRs: [ADR-0001 — Client–server multi-user architecture](./0001-client-server-multi-user-architecture.md), [ADR-0006 — Node.js and Express](./0006-node-express-api.md)
- Feature specs: [Feature 1](../../features/feature-1-user-auth.md) (auth); [Features 2–3](../../features/feature-2-todo-list-management.md) (list/todo isolation); [Feature 4](../../features/feature-4-user-profile-management.md) (profile scope)
- Cursor rules: [security.mdc](../../.cursor/rules/security.mdc), [auth-patterns.mdc](../../.cursor/rules/auth-patterns.mdc), [frontend-services.mdc](../../.cursor/rules/frontend-services.mdc)
- Implementation: `backend/app/authorization/authorization.js`
- Tests: `backend/tests/authenticate.test.js`, `backend/tests/auth.test.js`, ownership scenarios in `lists.test.js`, `todos.test.js`, `users.test.js`