# Writing Architecture Decision Records (ADRs)

A student guide for deciding **when** to write an ADR, **how to name and structure** it, and **how to keep it linked** to features and Cursor rules.

**Index & template:** [README.md](./README.md)  
**Related:** [features/framework.md](../../features/framework.md)

---

## What an ADR is

An **Architecture Decision Record** is a short, durable document that records a **cross-cutting choice** and the **reasons** behind it: context, decision, consequences, and alternatives you rejected.

| Artifact | Question it answers |
|----------|---------------------|
| **Feature spec** (`features/feature-N-*.md`) | *What* must the product do in this slice? |
| **Cursor rule** (`.cursor/rules/*.mdc`) | *How* must we implement day to day? |
| **ADR** (`docs/adr/NNNN-….md`) | *Why* did we choose this approach for the whole app (or a major subsystem)? |
| **NFR table** (`docs/nfr/`) | What quality bars apply app-wide? |
| **Living reference** | What API/schema/rules exist on `dev` *now*? |

ADRs outlive a single feature. Later features should rely on Accepted ADRs (e.g. “server is source of truth”, ownership rules) without re-arguing them in every spec.

---

## When to write an ADR (vs a feature or a rule)

| Situation | Write… |
|-----------|--------|
| New user-facing behavior for one feature | **Feature spec** (stories, FRs, AC) |
| Ongoing coding pattern (API shape, Vue style, test layout) | **Cursor rule** |
| Significant stack or architecture choice | **ADR** |
| Security or data-isolation model | **ADR** |
| Database engine / persistence approach | **ADR** |
| Deviation from an existing rule or ADR | **ADR** — then update the rule/spec |
| Button label or empty-state copy on one screen | **Screen Requirements** in the feature (not an ADR) |

**Rule of thumb:** if the choice will still matter after three features, and teammates might otherwise re-decide it, write an ADR.

**Write the ADR before or with** the first feature that depends on it. Link it from that feature’s header (`**Related:**`).

**Typical first ADRs for a new app:** client–server (or equivalent) split, security/auth model, database/persistence choice.

---

## Naming and filing

```text
docs/adr/
  README.md                      ← index + short template
  writing-adrs.md                ← this guide
  NNNN-short-kebab-title.md      ← one decision per file
```

| Part | Principle | Example |
|------|-----------|---------|
| **Number** | Four digits, sequential; never reuse | `0001`, `0002`, `0003` |
| **File slug** | kebab-case, specific capability | `0001-client-server-multi-user.md` |
| **Title** (`# ADR-NNNN: …`) | Short decision name, not a novel | `Client–server multi-user architecture` |
| **Status** | `Proposed` → `Accepted` (or `Deprecated` / `Superseded by ADR-XXXX`) | See header |

### Naming principles

1. **Name the decision, not the whole product.** Good: `Layered security architecture`. Weak: `How the app works`.
2. **Be specific enough to find later.** Prefer `MySQL relational database` over `Database`.
3. **Match file slug to title.** Same words, kebab-case in the filename.
4. **One decision per file.** Split choices that can change independently.
5. **Update the [README index](./README.md)** when you add or supersede an ADR.

---

## Structure (required sections)

Copy from [README.md](./README.md#template) or use this filled outline:

```markdown
# ADR-NNNN: Short title

**Status:** Proposed
**Date:** YYYY-MM-DD
**Deciders:** your team / course

## Context
## Decision
## Consequences
### Positive
### Negative / tradeoffs
## Alternatives considered
## Related artifacts
```

### Context — principles

- State the **problem or force** that required a choice.
- List **2–4 concrete questions** you had to answer.
- Mention constraints (stack, existing ADRs, deploy environment).
- Do **not** jump to the solution here — that is Decision.

### Decision — principles

- State what you chose in **one or two clear sentences**, then details (table or bullets).
- Be **specific**: technologies, boundaries, invariants.
- Include **invariants** that every later feature must obey.
- Diagrams (text or Mermaid) help for trust boundaries or request flow.

### Consequences — principles

- **Positive:** what you gain.
- **Negative / tradeoffs:** what you give up. Honesty makes the ADR useful later.
- Call out follow-on work for every feature (e.g. “filter by `userId`”).

### Alternatives considered — principles

- Use a table: **Option | Why not**.
- Include real alternatives you discussed.
- “Why not” should be a reason, not “we didn’t like it.”

### Related artifacts — principles

- Link **feature specs** that depend on this ADR.
- Link **Cursor rules** that enforce the decision day to day.
- Link **supersedes / superseded by** when status changes.
- Link **NFRs** or architecture diagrams when relevant.

---

## Principles for writing a good ADR

1. **One decision, one file.**
2. **Write for a future teammate** who was not in the room.
3. **Prefer durable rationale** over temporary fashion.
4. **Keep feature behavior out of ADRs** — stories/Gherkin stay in feature specs.
5. **Keep coding patterns in rules** — encode “how” in `.cursor/rules/` after Accept.
6. **Mark status honestly** — supersede instead of silently rewriting history.
7. **Link both ways** — ADR ↔ feature `**Related:**` and rules.
8. **Update when the decision changes** so Accepted ADRs match the code.
9. **Stay concise** — deep API tables belong in feature API Requirements or `features/reference/`.
10. **Name Deciders** so ownership of the decision is clear.

---

## Workflow checklist

- [ ] Confirmed this is architecture/why — not a single feature story or a style rule alone
- [ ] Chose next free `NNNN` and kebab filename
- [ ] Filled Context, Decision, Consequences, Alternatives, Related
- [ ] Status set (`Proposed` or `Accepted`)
- [ ] Added row to [README.md](./README.md) index
- [ ] Linked from the first feature that depends on it (`**Related:**`)
- [ ] If the decision implies ongoing coding constraints, added/updated a Cursor rule and linked it
- [ ] If an NFR Approach depends on this ADR, linked from `docs/nfr/quality-attributes.md`

---

## Anti-patterns

| Avoid | Do instead |
|-------|------------|
| ADR that only restates one feature’s stories | Keep behavior in the feature spec; ADR for shared *why* |
| ADR with no alternatives | Always record what you rejected and why |
| Coding tutorial inside the ADR | Point at rules + short invariants |
| Changing an Accepted ADR silently after ship | New ADR or **Superseded by ADR-XXXX** |
| One giant “Architecture.md” | Numbered ADRs so decisions can be superseded one at a time |

---

## Relationship to feature writing

```text
Need new product behavior?     → feature specs (+ writing guides under features/)
Need a lasting architecture why? → docs/adr/writing-adrs.md  (this file)
Need daily how-to for agents?    → .cursor/rules/*.mdc
```

After an ADR is **Accepted**, feature ownership, API, and security-related FRs should **align with** it — not reinvent those decisions in each file.
