# Speckit App

Spec-Driven Development (SDD) starter kit — **empty product shell**.

Specifications define *what* to build (`features/`). Cursor rules define *how* (`.cursor/rules/`). Tests verify both.

This repository was generated from the Speckit starter kit. Replace this README’s product name, database, and API prefix, then add `features/feature-1-….md` before writing application code.

**Docs:** [features/framework.md](features/framework.md) · [docs/STARTER-KIT.md](docs/STARTER-KIT.md) · [docs/adr/README.md](docs/adr/README.md)

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, Vuetify 4, Vite, vue-router, axios |
| Backend | Node.js (ES modules), Express, Sequelize, MySQL |
| Tests | Jest + supertest (backend), Vitest + `@vue/test-utils` (frontend) |

Default ports: frontend `8082`, backend `3200`. API mount: `/api` (change in `backend/server.js` and `frontend/src/services/services.js`).

---

## Getting started

```bash
npm install --prefix frontend
npm install --prefix backend
npm install

# macOS / Linux / Git Bash:
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test
# Windows PowerShell / cmd:
#   copy backend\.env.example backend\.env
#   copy backend\.env.test.example backend\.env.test
# Create MySQL databases; set DB_* and AUTH_SECRET

npm test
cd backend && npm run dev
cd frontend && npm run dev
```

Works on **macOS, Windows, and Linux** — use `npm run …` for all tooling (PDF, Agility, bundles).

## Branching

| Branch | Purpose |
|--------|---------|
| `main` | Starter kit only — no feature implementation |
| `dev` | Integration |
| `feature/N-*` | One feature at a time |

```bash
git checkout -b dev
git checkout -b feature/1-short-name
```

## Next steps

1. Write `features/feature-1-….md` (see [framework template](../../features/framework.md#feature-spec-template) — **Status**, **Input**, **FR-00N**, **SC-00N**, **Key Entities**, **Agent implementation request**, **Definition of Done**).
2. Update `features/README.md` catalog.
3. Implement with Cursor: `Implement @features/feature-1-….md per its Agent implementation request and Definition of Done`, or one layer at a time (reference updates in the same PR when API/schema changes).
