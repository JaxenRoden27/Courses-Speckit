# API Reference

**Status:** empty starter — no application endpoints yet.

API mount path defaults to `/api` (see `backend/server.js`). Update this file when endpoints merge to `dev`.

## Endpoints

*(none)*

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>` (when Feature auth is implemented).
