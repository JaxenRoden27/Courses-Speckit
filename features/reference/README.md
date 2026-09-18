# Reference Specifications

**Living snapshot** of the integrated product on `dev` after merged features.

These files answer: *"What does the app look like right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

**Student guide:** [writing-living-reference.md](./writing-living-reference.md) — when/how to update api, data-model, and behavior.

## Maintenance

| When | Action |
|------|--------|
| Feature merges to `dev` | **Required DoD:** update the matching reference file(s) in the same PR — `data-model.md` / `api.md` if schema or routes/payloads changed; **`behavior.md` if product rules changed**. See [Merge checklist + Agility sync](../framework.md#merge-checklist--agility-sync) |
| Feature in progress | Each `feature-N-*.md` includes an **Agent implementation request** block — paste or `@` the spec so Cursor updates reference in the same implementation PR |
| New feature in progress | Feature spec owns the **delta**; reference updates with implementation, not as optional post-merge cleanup |
| Drift suspected | Compare reference to code and feature specs; fix reference or code |

## Files

| File | Contents |
|------|----------|
| [data-model.md](./data-model.md) | Current database tables, columns, associations |
| [api.md](./api.md) | Current REST API |
| [behavior.md](./behavior.md) | Current product rules (ownership, sort, validation, UI rules) |
| [writing-living-reference.md](./writing-living-reference.md) | Student guide — maintaining reference |

## Feature provenance

| Area | Introduced |
|------|------------|
| *(none yet)* | Add rows as features merge to `dev` |
