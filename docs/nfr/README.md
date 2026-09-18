# Non-Functional Requirements (quality attributes)

Living snapshot of **system characteristics** (“ilities”) for this product.

| Artifact | Question |
|----------|----------|
| [Feature specs](../../features/) | What must the product *do*? |
| **This folder** (`docs/nfr/`) | What quality bars apply *across* the product? |
| [ADRs](../adr/README.md) | *Why* did we choose a particular approach? |
| [Cursor rules](../../.cursor/rules/) | *How* must code meet ongoing constraints? |
| [Reference](../../features/reference/) | What API/schema exists on `dev` now? |

NFRs here do **not** authorize new product behavior. Feature specs still authorize *what* to build.

**Agent literacy:** [`.cursor/rules/quality-attributes.mdc`](../../.cursor/rules/quality-attributes.mdc) — honor **Accepted**; treat **Deferred** as guidance only; do not invent for **Out of scope**.

---

## Files

| File | Contents |
|------|----------|
| [quality-attributes.md](./quality-attributes.md) | Attribute table + **Status** / **Links** documentation |
| [writing-quality-attributes.md](./writing-quality-attributes.md) | Student guide — when/how to write NFR rows |

**Student guide:** [writing-quality-attributes.md](./writing-quality-attributes.md)

See the teaching repo’s `docs/nfr/quality-attributes.md` for a filled-in example table, or expand [quality-attributes.md](./quality-attributes.md) as you set bars for your product.

---

## When to update

| When | Action |
|------|--------|
| New app-wide quality bar (or explicit “out of scope”) | Update [quality-attributes.md](./quality-attributes.md) |
| Choose *how* to meet a bar | Write or update an [ADR](../adr/README.md); link from the attribute row |
| Ongoing coding constraint for agents | Add/update a `.cursor/rules/*.mdc` entry |
| Feature-local quality only | Prefer **Requirements (FR-00N)** / **Success Criteria (SC-00N)** + Gherkin in that feature |
