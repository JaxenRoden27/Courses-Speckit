# Writing Living Reference

A student guide for maintaining `features/reference/` — the **current integrated snapshot** of the product on `dev`.

**Index:** [README.md](./README.md)  
**Files:** [api.md](./api.md) · [data-model.md](./data-model.md) · [behavior.md](./behavior.md)  
**Related:** [framework.md](../framework.md) · [writing feature design](../writing-feature-design.md) (when present)

---

## What living reference is

**Living reference** answers: *“What does the app look like / enforce right now on `dev`?”*

| Artifact | Answers | Authorizes new work? |
|----------|---------|----------------------|
| **Feature spec** (`feature-N-*.md`) | *What changes* this feature adds | **Yes** |
| **Living reference** (`features/reference/`) | *What exists* after merges | **No** — snapshot only |

Feature specs are **deltas**. Reference files are **current state**. Update reference in the **same PR** as implementation (required DoD). It is **not** auto-generated from specs.

Until Feature 1+ merges, keep the stub files empty (or “none yet”) — do not invent API/schema from imagination.

---

## The three files

| File | Contents | Update when… |
|------|----------|----------------|
| [**api.md**](./api.md) | Routes, auth, payloads, errors | Routes or payloads change |
| [**data-model.md**](./data-model.md) | Tables, columns, associations | Schema changes |
| [**behavior.md**](./behavior.md) | Product rules (ownership, sort, validation, UI rules) | Rules change |

| You changed… | Update |
|--------------|--------|
| Endpoint or JSON fields | **api.md** |
| Table/column/FK/association | **data-model.md** |
| Ownership, sort, validation, durable UI rules | **behavior.md** |
| Refactor with same external contract | Usually **none** |

---

## Principles

1. **Describe now, not a full history essay** (use provenance tables for “introduced in Feature N”).
2. **Never authorize scope** — new behavior needs a feature spec first.
3. **Same PR as code** — not “docs later.”
4. **Edit as a delta** on the integrated snapshot — don’t wipe older shipped surface.
5. **Match shipped code**, not an unshipped draft.
6. **Keep deep Gherkin in feature files**; behavior.md is a rule index.
7. **One fact, one place** (types → data-model; paths → api; rules → behavior).
8. **Record provenance** when areas appear.
9. **Align with Accepted ADRs** (e.g. ownership / 404).
10. **Stubs stay empty** until real features merge.

---

## Writing each file (short)

### api.md
Endpoint tables + JSON bodies/responses + Auth Yes/No + provenance. Extend existing docs when adding fields; don’t delete still-shipped routes.

### data-model.md
Field / Type / Rules tables + associations. Reflect shipped schema only; delta features add/change fields in place.

### behavior.md
Tables of **Rule | Enforcement | Introduced**. Product rules only — not a second API catalog or full Gherkin suite.

---

## Workflow (per feature PR)

1. Implement from the feature spec only.
2. Schema → data-model; routes/payloads → api; rules → behavior.
3. Update provenance.
4. Check consistency across the three files and tests.
5. Tick DoD / Agent implementation request reference lines.

---

## Checklist

- [ ] Chose the right file(s) (or none)
- [ ] Describes integrated state after this PR
- [ ] No unauthorized new scope
- [ ] Provenance updated
- [ ] Consistent with code and tests
- [ ] Did not delete still-shipped older areas

---

## Anti-patterns

| Avoid | Do instead |
|-------|------------|
| Docs-only follow-up PR | Same PR as implementation |
| Replace api.md with only this feature’s routes | Merge into full snapshot |
| Requirements living only in reference | Feature specs authorize |
| behavior.md as full Gherkin copy | Rule index + enforcement pointer |
