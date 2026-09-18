# Quality attributes

App-wide non-functional targets for **this** product.

**Teaching policy:** Specs say *what* to build. This table says *how good* the system should be. Only **Accepted** rows (and feature **Requirements (FR-00N)** / **Success Criteria (SC-00N)**) constrain implementation. **Deferred** is the quality backlog / example. **Out of scope** is what not to build. See [`.cursor/rules/quality-attributes.mdc`](../../.cursor/rules/quality-attributes.mdc).

## Column meanings

| Column | Meaning |
|--------|---------|
| **Target** | Measure or bar — prefer a **number**. Illustrative until Status is **Accepted** and tests enforce it. |
| **Approach** | How the target is realized or limited |
| **Status** | **Accepted** / **Accepted (minimal)** / **Deferred** / **Out of scope** (see below) |
| **Links** | ADR (why), Cursor rule (how), code path, or **—** |

## Status values

| Status | Meaning |
|--------|---------|
| **Accepted** | In force — do not regress |
| **Accepted (minimal)** | Thin bar in force — do not expand |
| **Deferred** | Documented example — not a coding requirement unless a feature spec says so |
| **Out of scope** | Do not invent |

## Links column

| Link type | When |
|-----------|------|
| ADR | Approach decision |
| Cursor rule | Day-to-day agent/code constraint |
| Code path | Concrete implementation |
| **—** | No artifact yet |

| Attribute | Target | Approach | How we verify | Status | Links |
|-----------|--------|----------|---------------|--------|-------|
| **Security** | e.g. **100%** protected routes require auth; **0** cross-user leaks in tests | *(define approach)* | | Deferred | |
| **Reliability** | e.g. happy-path write success ≥ **99%** in tests | | | Deferred | |
| **Availability** | e.g. demo uptime ≥ **95%** of lab session | | | Deferred | |
| **Performance** | e.g. p95 API **&lt; 200 ms** local; first paint **&lt; 2 s** | | | Deferred | |
| **Observability** | e.g. **100%** unhandled errors logged; retain logs **≥ 7 days** | | | Deferred | |
| **Usability** | e.g. core happy path in **≤ 3 minutes**; **≤ 2** clicks to add a todo on an existing list | | | Deferred | |
| **Accessibility (a11y)** | e.g. aim **WCAG 2.2 AA** for primary flows | | | Deferred | |
| **Internationalization (i18n)** | e.g. **1** locale | | | Out of scope | |
| **Maintainability** | **100%** Gherkin scenarios mapped before merge; `npm test` green | Cursor rules + feature specs as source of truth | Merge checklist; `npm test` | Accepted | [framework.md](../../features/framework.md), [quality-attributes.mdc](../../.cursor/rules/quality-attributes.mdc) |

---

## Feature-local NFRs

If only one feature needs a bar:

1. Put it in that feature’s **Requirements (FR-00N)** or **Success Criteria (SC-00N)**.
2. Add Gherkin when tests must prove it.
3. Optionally link from a row here (“see Feature N **FR-00N** / **SC-00N**”).

See [feature spec template](../../features/framework.md#feature-spec-template) in the teaching repo.

---

## Changing a bar

1. Edit **Target**, **Approach**, **Status**, **Links**. Prefer a number in **Target**.
2. **Approach** change → [ADR](../adr/README.md); add to **Links**.
3. Agent coding constraint → `.cursor/rules/`; add to **Links**.
4. API/schema change → `features/reference/` in the same feature PR ([Agent implementation request](../../features/framework.md#agent-implementation-request)).
5. **Deferred** → **Accepted** only with matching verification.
