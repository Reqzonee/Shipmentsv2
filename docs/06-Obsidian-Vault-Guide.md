# Obsidian Vault Guide

## Setup

1. Open Obsidian → **Open folder as vault**
2. Select: `d:\SMVS\shipments\docs`
3. Enable **Settings → Files & Links → Detect all file extensions**

---

## Vault Structure

```
docs/
├── 00-Assignment-Overview.md      ← Problem statement
├── 01-Architecture-Plan.md
├── 02-Tech-Stack.md
├── 03-API-Specification.md
├── 04-Data-Models.md
├── 05-Implementation-Phases.md
├── 06-Obsidian-Vault-Guide.md     ← This file
├── 07-Software-Prerequisites.md   ← What to download/install
├── 08-UI-Swagger-Visualization.md ← UI + charts + Swagger plan
├── 09-AGENT-HANDOFF.md            ← AI agents: READ FIRST after context reset
├── 10-Elevate-References.md       ← Patterns from Elevate.Admin/Server/Elly
├── daily/                         ← Session progress logs
│   ├── day-0.md
│   └── day-0b-elevate-study.md
└── decisions/                     ← Architecture Decision Records
    └── ADR-001-queue-choice.md
```

---

## For AI Agents (Context Continuity)

When Cursor (or any agent) loses context:

1. Open **[[09-AGENT-HANDOFF]]** first — status, locked decisions, next action
2. Then [[05-Implementation-Phases]] — what's left
3. Then latest file in `daily/`
4. Only then dig into code

**Rule:** End every significant session by updating `09-AGENT-HANDOFF.md` status table + next action.

---

## Recommended Obsidian Plugins

| Plugin | Purpose |
|--------|---------|
| **Excalidraw** | Draw architecture diagrams |
| **Dataview** | Query tasks across notes |
| **Templater** | Templates for ADRs, daily logs |
| **Git** | Sync vault with repo |

---

## Linking Convention

Use `[[wikilinks]]` between notes:

```markdown
See [[01-Architecture-Plan]] for the worker design.
```

---

## Daily Log Template

Create `daily/day-N.md`:

```markdown
# Day N — YYYY-MM-DD

## Goals
- [ ] ...

## Done
- 

## Blockers
- 

## Handoff update
- Updated [[09-AGENT-HANDOFF]]? Yes/No

## Notes for Loom
- 
```

---

## What to Track During Build

| Note | Update When |
|------|-------------|
| `09-AGENT-HANDOFF.md` | **Every session end** — status + next action |
| `05-Implementation-Phases.md` | Check off completed tasks |
| `daily/day-N.md` | End of each day / long session |
| `decisions/` | Any non-obvious tech choice |
| `03-API-Specification.md` | If API shapes change |
| `08-UI-Swagger-Visualization.md` | If UI scope changes |

---

## Related Notes

- [[09-AGENT-HANDOFF]]
- [[00-Assignment-Overview]]
- [[05-Implementation-Phases]]
- [[07-Software-Prerequisites]]
