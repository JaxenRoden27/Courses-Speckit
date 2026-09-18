# Digital.ai Agility import

Export user stories and Gherkin acceptance criteria from `features/` into CSV files, or push via the Bulk JSON API.

## Generate CSV import files

```bash
npm run agility:export
# or:
node scripts/export-agility-import.mjs --project "Your Project Name"
```

Creates `docs/agility-import/PortfolioItem.csv`, `Story.csv`, and `Test.csv` for Excel import into Agility.

Feature specs are **auto-discovered** from `features/feature-N-*.md` (epic title = `# Feature: …`). Before first export, set `DEFAULT_PROJECT` in `scripts/agility/backlog-data.mjs` (or pass `--project`) to your Agility Scope name.

## Push via Agility Bulk API

1. Copy `.env.agility.example` → `.env.agility` and set `AGILITY_BASE_URL`, `AGILITY_ACCESS_TOKEN`, `AGILITY_SCOPE`.
2. Run:

```bash
npm run agility:push                    # full create
npm run agility:push -- --feature 1     # one feature
npm run agility:push -- --feature 1 --upsert   # update existing
```

See the OC CS Speckit `docs/agility-import/README.md` in the source kit repo for full Excel import steps and upsert behavior, or expand this file as your team adopts Agility.
