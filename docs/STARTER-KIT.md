# Speckit Starter Kit

Use this zip to start a **new** Spec-Driven Development (SDD) application — not to rebuild the **Todo** example application that ships with OC CS Speckit.

This package is the **SDD factory**: methodology, Cursor rules, empty Vue + Express + MySQL shells, test harness, and tooling. You write **new** feature specs for your product, then implement them with Cursor.

**Related:** [features/framework.md](../features/framework.md) · [constitution](../.cursor/rules/constitution.mdc) · [Student assignment](./ASSIGNMENT-starter-kit.md)

---

## What this kit is for

| Goal | Use this kit? |
|------|----------------|
| Start a **new** app with the same SDD process + stack | **Yes** |
| Clone / continue the **Todo** example application | **No** — clone this repo’s `dev` branch instead |
| Rebuild Todo locally from `features/feature-*.md` (strip answer-key code) | **No** — use `npm run reset:example -- --yes` in this repo |
| Instructor answer key with full Todo implementation | **No** — use the full OC CS Speckit repo |

---

## What’s in the zip

### Include (reusable)

| Area | Contents |
|------|----------|
| **Methodology** | `features/framework.md`, empty catalog, student writing guides (requirements, design, living reference) |
| **Cursor rules** | All `.cursor/rules/*.mdc` (constitution, **agent-behavior**, structure, API, auth, security, UI, testing, services) |
| **ADRs** | `docs/adr/README.md` + template + [writing-adrs.md](../docs/adr/writing-adrs.md) (no todo-specific numbered ADRs) |
| **NFRs** | `docs/nfr/` — quality-attributes stub + [writing-quality-attributes.md](../docs/nfr/writing-quality-attributes.md) |
| **Reference stubs** | Empty `features/reference/data-model.md`, `api.md`, and `behavior.md` + [writing-living-reference.md](../features/reference/writing-living-reference.md) |
| **Tooling** | PDF export, Agility CSV/API scripts, deploy bundle scripts, CI workflows |
| **Frontend shell** | Vue 3 + Vuetify 4 + Vite + axios client + `App.vue` + placeholder home + harness tests |
| **Backend shell** | Express + Sequelize config + empty models/routes + harness tests |
| **Env examples** | `backend/.env.example`, `.env.test.example`, `.env.agility.example` |

### Exclude (todo-specific — not in the zip)

| Exclude | Why |
|---------|-----|
| `features/feature-1` … `feature-5-*.md` | Todo product requirements |
| Populated `features/reference/api.md` / `data-model.md` / `behavior.md` | Todo integrated snapshot |
| Feature models, routes, controllers, services, views | Built from *your* specs |
| Feature tests (`auth.test.js`, `Dashboard.test.js`, …) | Written with each feature |
| Generated PDFs / Agility CSVs | Regenerate after you have specs |
| `node_modules/`, `.env*`, `dist/`, `backend/deploy/` | Local / build artifacts |

---

## Create the zip (from the OC CS Speckit repo)

Works on **macOS, Windows, and Linux** (Node.js only — no zsh required).

From the **OC CS Speckit** repository root (this repo; directory may still be named `todo-speckit`):

```bash
npm run starter:zip
# or:
node scripts/bundle-starter-kit.mjs
```

Optional:

```bash
node scripts/bundle-starter-kit.mjs --name myapp-speckit-template
node scripts/bundle-starter-kit.mjs --out ~/Desktop
```

Output (default): `dist/speckit-starter-kit.zip`

The script:

1. Copies allowlisted process + tooling + package manifests from this repo.
2. Overlays empty app shells from `scripts/starter-kit/overlay/`.
3. Writes a short `README.md` for the new repo.
4. Zips the result (no `node_modules`, no secrets). On Windows it uses PowerShell `Compress-Archive`; on macOS/Linux it uses `zip`.

### Platform notes

| Task | macOS / Linux | Windows (PowerShell / cmd) |
|------|---------------|----------------------------|
| Create zip | `npm run starter:zip` | Same |
| Copy env files | `cp backend/.env.example backend/.env` | `copy backend\.env.example backend\.env` |
| PDF export | `npm run specs:pdf` / `npm run specs:pdf:app` | Same (uses Chrome/Edge if installed, else Puppeteer) |
| Deploy bundles | `npm run bundle:all` | Same |

---

## After unzip — first week checklist

### 1. Unpack and init git

```bash
unzip speckit-starter-kit.zip -d myapp-speckit
cd myapp-speckit
git init
git add .
git commit -m "SDD starter kit"
git checkout -b dev
```

### 2. Rename the product

**Start with the `package.json` `name` fields** (npm package identity for the monorepo):

| File | Default `name` | Change to |
|------|----------------|-----------|
| `package.json` (root) | `speckit-app` | e.g. `myapp-speckit` |
| `frontend/package.json` | `speckit-app-frontend` | e.g. `myapp-frontend` |
| `backend/package.json` | `speckit-app-backend` | e.g. `myapp-backend` |

Then do a **project-wide search-and-replace** for these placeholder strings across the unzipped tree (IDE find-in-files or `rg`). You are not rewriting every file — only files that contain the string will change; most rules and framework docs will not.

| Placeholder | Replace with | Typical hits |
|-------------|--------------|--------------|
| `Speckit App` | Your display name | `README.md`, `Home.vue`, `server.js` log line, Agility examples |
| `speckit-db` | Your MySQL database name | `.env.example`, `.env.test.example`, `db.config.js` |
| `/api/` | Your API mount path (if different) | `backend/server.js`, `frontend/src/services/services.js` |
| Ports `8082` / `3200` | Only if you must change them | Vite config, Express `PORT`, CORS origin |

Also update when relevant:

- `AGILITY_SCOPE` in `.env.agility.example`
- `scripts/agility/backlog-data.mjs` — `DEFAULT_PROJECT` (Agility Scope name)

`npm run specs:pdf` and Agility export/push **auto-discover** `features/feature-N-*.md` (epic titles from `# Feature: …`). PDF also picks up `.cursor/rules/*.mdc`, `docs/adr/NNNN-*.md`, `docs/nfr/*.md`, and `docs/arch_diagrams/*.md`, and **renders Mermaid** (including C4). You do **not** edit file lists when adding features, ADRs, NFR, or arch docs.

### 3. Install and configure

```bash
npm install --prefix frontend
npm install --prefix backend
npm install                    # root (md-mermaid-pdf for specs:pdf)

# Required for local API + tests (macOS / Linux / Git Bash)
cp backend/.env.example backend/.env
cp backend/.env.test.example backend/.env.test

# Windows PowerShell / cmd equivalents:
#   copy backend\.env.example backend\.env
#   copy backend\.env.test.example backend\.env.test

# Edit DB_* and AUTH_SECRET in both files

# Optional — only if you use Agility API push/export
cp .env.agility.example .env.agility
# Windows: copy .env.agility.example .env.agility
# Edit AGILITY_BASE_URL, AGILITY_ACCESS_TOKEN, AGILITY_SCOPE
```

| Example file | Copy to | When |
|--------------|---------|------|
| `backend/.env.example` | `backend/.env` | Always (dev server) |
| `backend/.env.test.example` | `backend/.env.test` | Always (backend tests) |
| `.env.agility.example` | `.env.agility` | Only for `agility:push` / `agility:verify` |

There is **no** frontend `.env.example` — the SPA uses Vite `import.meta.env.DEV` for the API base URL (see `frontend/src/services/services.js`).

Create MySQL databases named in your `.env` files (XAMPP, WAMP, or native MySQL on any OS).

### 4. Verify the shell

```bash
npm test                       # harness tests only
cd backend && npm run dev      # API starts
cd frontend && npm run dev     # SPA on :8082
```

### 5. Write Feature 1

1. Add `features/feature-1-short-name.md` using the template in [framework.md](../features/framework.md) (`# Feature: …`, **Status**, **Input**, story **Priority** / **Independent test**, **FR-00N**, **Assumptions**, **Edge Cases**, **SC-00N**, **Key Entities**, **Agent implementation request**, **Definition of Done**).
2. Add a row to `features/README.md`.
3. Branch: `git checkout -b feature/1-short-name`
4. Implement with Cursor — `Implement @features/feature-1-….md per its Agent implementation request and Definition of Done`, or layer-by-layer prompts (see framework [Agent implementation request](../features/framework.md#agent-implementation-request)).

### 6. Do not

- Copy todo feature specs into the new repo as if they were your product.
- Implement on `main` — keep `main` as the starter baseline; work on `dev` / `feature/*`.
- Commit `.env` or Agility tokens.

---

## Regenerating the zip after kit changes

When you improve rules, framework, or overlay shells in **OC CS Speckit**:

1. Edit files under `.cursor/rules/`, `features/framework.md`, or `scripts/starter-kit/overlay/`.
2. Run `npm run starter:zip` again.
3. Distribute the new zip (or publish a `scaffold-vN` tag of the template contents).

---

## Overlay source of truth

Empty shells that replace todo implementation live in:

```text
scripts/starter-kit/overlay/
```

The bundle script always applies this overlay **after** copying shared files from the repo, so the zip never ships Dashboard, MenuBar, list/todo models, or feature-1…5 specs.
