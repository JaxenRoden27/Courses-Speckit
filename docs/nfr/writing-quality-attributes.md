# Writing Quality Attributes (NFRs)

A student guide for recording **app-wide quality bars** (“ilities”) in `docs/nfr/quality-attributes.md`: what they are, how to fill each column, how to set **Status**, and when to use a feature FR/SC instead.

**Living table:** [quality-attributes.md](./quality-attributes.md)  
**Folder index:** [README.md](./README.md)  
**Agent literacy:** [`.cursor/rules/quality-attributes.mdc`](../../.cursor/rules/quality-attributes.mdc)  
**Related:** [writing ADRs](../adr/writing-adrs.md)

---

## What quality attributes are

**Quality attributes** (non-functional requirements, or NFRs) describe **how good** the system should be — security posture, performance, observability, maintainability — not **what feature** to build next.

| Artifact | Question |
|----------|----------|
| **Feature specs** | *What* must the product do? |
| **Quality attributes** (`docs/nfr/`) | *How good* must it be across the product? |
| **ADRs** | *Why* this Approach for a quality? |
| **Cursor rules** | *How* must code meet an Accepted bar day to day? |

NFRs here do **not** authorize new product behavior by themselves. A **Deferred** performance number does not mean “add caching this sprint” unless a feature **FR-00N** / **SC-00N**, Gherkin, or an instructor explicitly requires it.

---

## When to edit the NFR table (vs a feature or ADR)

| Situation | Write / update… |
|-----------|-----------------|
| App-wide bar or explicit non-goal | **[quality-attributes.md](./quality-attributes.md)** row |
| *How* to meet a bar | **ADR** — then link it from the row |
| Ongoing coding constraint for agents | **Cursor rule** — then link it from the row |
| Quality that only one feature needs | Feature **FR-00N** / **SC-00N** (+ Gherkin); optional pointer in the table |
| New user-facing capability | **Feature spec** — not a new NFR row alone |

**Rule of thumb:** if every feature must respect the bar (or we must explicitly refuse to build for it), it belongs in the quality-attributes table.

**Typical rows to define early:** Security, Data integrity (if multi-user), Observability (minimal), Maintainability (specs + tests), plus honest **Deferred** / **Out of scope** rows for performance, HA, i18n, etc.

---

## The table shape

| Attribute | Target | Approach | How we verify | Status | Links |
|-----------|--------|----------|---------------|--------|-------|
| **Security** | … | … | … | Deferred | — |

### Column principles

| Column | Write this | Avoid |
|--------|------------|--------|
| **Attribute** | Standard ility name | Vague “Quality” or feature names |
| **Target** | Prefer a **number** or countable bar | “Make it fast” with no measure |
| **Approach** | How the bar is realized *or* why it is limited | A second Target paragraph |
| **How we verify** | Tests, manual check, or `N/A` | “Somehow” |
| **Status** | Accepted / Accepted (minimal) / Deferred / Out of scope | Mixing Accepted wording with Deferred intent |
| **Links** | ADR / rule / code / feature, or **—** | Orphan Accepted rows with no enforcement link |

Targets on **Deferred** / **Out of scope** rows are often **illustrative**, not production SLOs.

---

## Status values — principles

| Status | Meaning | When writing / coding |
|--------|---------|------------------------|
| **Accepted** | In force | Do **not** regress; back with Links |
| **Accepted (minimal)** | Thin bar in force | Meet Approach only; do **not** expand |
| **Deferred** | Documented example | Guidance only unless a feature/human requires it |
| **Out of scope** | Explicit non-goal | Do **not** invent for this bar |

**Promoting Deferred → Accepted** requires matching **How we verify**.

---

## Links column — principles

| Link type | Use when |
|-----------|----------|
| **ADR** | *Why* this Approach |
| **Cursor rule** | *How* agents must behave every day |
| **Code path** | Minimal concrete implementation |
| **Feature / framework** | Process or FR/SC that carries the bar |
| **—** | Common for Deferred rows with no artifact yet |

---

## Principles for writing good NFR rows

1. **One ility per row.**
2. **Prefer measurable Targets.**
3. **Separate Target from Approach.**
4. **Be honest about Status.**
5. **Link enforcement for Accepted rows.**
6. **Keep feature-local quality in features** (FR/SC + Gherkin).
7. **Out of scope is explicit** — stops inventing HA/i18n/etc.
8. **Accepted (minimal) means thin.**
9. **Align with ADRs and rules.**
10. **Update the table when reality changes.**

---

## Feature-local NFRs

1. Put the bar in that feature’s **FR-00N** / **SC-00N**.
2. Add Gherkin when tests must prove it.
3. Optionally pointer from the app-wide table.

Do **not** invent a feature solely to “add performance.”

---

## Workflow: add or change a bar

1. Edit [quality-attributes.md](./quality-attributes.md).
2. Approach change → ADR; add to **Links**.
3. Agent coding constraint → Cursor rule; add to **Links**.
4. API/schema/rules change → `features/reference/` in the same feature PR.
5. **Deferred → Accepted** only with real verification.

---

## Checklist

- [ ] Clear ility name
- [ ] Measurable Target
- [ ] Approach = realization or deliberate non-goal
- [ ] How we verify matches Status
- [ ] Accepted rows have Links
- [ ] No conflict with Accepted ADRs/rules
- [ ] Feature-only concerns left in FR/SC

---

## Anti-patterns

| Avoid | Do instead |
|-------|------------|
| Treating every Deferred Target as a sprint commitment | Honor Status |
| “Make it secure” with no Target | Countable bars + verification |
| Accepted row with Links = **—** forever | Add ADR/rule/tests or demote |
| Putting product stories in NFRs | Feature specs |
| Inventing out-of-scope platforms | Respect **Out of scope** |

---

## How this fits other guides

```text
Product behavior (what)     → features/ (writing-feature-*.md)
Architecture why            → docs/adr/writing-adrs.md
Quality bars (how good)     → docs/nfr/writing-quality-attributes.md  (this file)
Day-to-day how for agents   → .cursor/rules/*.mdc
```
