# Memory index

Auto-loaded every session (CLAUDE.md imports it). One line per memory, hook only — the file
holds the content. Project rulings live here, versioned with the code; Claude's native
per-machine memory is for user-level preferences only.

A memory is one file, one fact, with frontmatter:

```markdown
---
name: <short-kebab-case-slug>
description: <one line — used to judge relevance>
metadata:
  type: project | feedback | reference
---
<the fact, then **Why:** and **How to apply:**. Link related memories with [[name]].>
```

Write one the moment a directional decision is made. Rejections go in
`rejected-approaches.md` — one file, one ledger. Before writing, check an existing file
doesn't already cover it: update rather than duplicate; delete rulings that turn out wrong.

## Rulings
- [rejected-approaches](rejected-approaches.md) — what we will NOT do, each with its why and revival condition

- [first-version](first-version.md) � completed scope, Blender provenance, retained balance and mandatory review boundary
