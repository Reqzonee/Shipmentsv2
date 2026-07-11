# Bulk Action Platform — Assignment Overview

> **Company:** Shipmnts  
> **Deadline:** 2 days from receipt  
> **Scope:** Backend-heavy (API mandatory). We will also ship a **polished React UI**, **live visualizations**, and **Swagger** to impress — plus Postman + Loom as required.

---

## What They Are Asking For (Plain English)

Shipmnts wants you to build a **Bulk Action Platform** — a system that lets CRM users perform operations on **many records at once** (e.g., update 10,000 contacts' status in one go).

Think of it like Gmail's "Select all → Archive" but for CRM data, with:
- Background job processing (not blocking the API)
- Progress tracking
- Per-record success/failure logs
- Architecture that makes adding new action types easy later

**Important nuance:** The assignment says *"Only API, not need to implement the UI"* — meaning the **API is mandatory**, UI is bonus. **Our bar is higher:** clean CRM-style UI, progress/stats charts, Swagger at `/docs`, and Postman — so the Loom demo looks like a real product.

---

## Problem Statement Breakdown

### Core Problem
Design and implement a **scalable, extensible bulk action engine** that can:
1. Accept a bulk action request (start with **Bulk Update** on **Contact** entity)
2. Process records in **batches** asynchronously
3. Handle **thousands of entities per minute**
4. Scale **horizontally** as load grows
5. Log every entity outcome (success / failure / skipped)
6. Expose APIs for status, progress, stats, and log retrieval

### Entity Scope (For This Assignment)
- **Only implement one entity:** `Contact` with fields like `name`, `email`, `age`, `status`
- **Architecture must be entity-agnostic** — easy to plug in Companies, Leads, etc. later
- Test with **a few thousand** records; design for **millions**

### Mandatory Features

| Feature | Description |
|---------|-------------|
| Bulk Update | Update multiple fields across many contacts |
| Batch Processing | Process in chunks, not one-by-one API calls |
| Job Queue | Async processing with status: `queued → running → completed/failed` |
| Logging | Per-entity log entries with success/error details |
| Statistics API | Counts: success, failure, skipped |
| List Actions | `GET /bulk-actions` |
| Create Action | `POST /bulk-actions` |
| Action Status | `GET /bulk-actions/:actionId` |
| Action Stats | `GET /bulk-actions/:actionId/stats` |
| Postman Collection | All endpoints documented |
| Loom Video | Architecture walkthrough + demo |

### Optional Enhancements (Document + Implement for Extra Points)

| Enhancement | Requirement |
|-------------|-------------|
| Rate Limiting | Per `accountId`, max ~10k events/min |
| De-duplication | Skip duplicates by `email`, log as `skipped` |
| Scheduling | Schedule bulk action for future datetime |

---

## What "Good" Looks Like to Evaluators

They are likely scoring on:

1. **Architecture** — Is it modular? Can you add `BulkDelete` or `BulkAssign` without rewriting everything?
2. **Scalability** — Queue + workers + batching + horizontal scale story
3. **Reliability** — Retries, error handling, idempotency considerations
4. **Observability** — Logs, stats, progress tracking
5. **API Design** — Clean REST, good response shapes
6. **Documentation** — Postman, Loom, clear README
7. **Bonus features** — Rate limit, dedup, scheduling

---

## Deliverables Checklist

- [ ] Backend API (Node.js)
- [ ] MongoDB data layer
- [ ] Redis + BullMQ job queue
- [ ] Worker process(es) for batch processing
- [ ] Sample Contact seed data + CSV for testing
- [ ] Postman collection
- [ ] React frontend (demo UI)
- [ ] Loom video (architecture + demo)
- [ ] README with setup instructions
- [ ] Optional: rate limiting, dedup, scheduling

---

## Related Notes

- [[09-AGENT-HANDOFF]] ← **AI agents: start here after context reset**
- [[01-Architecture-Plan]]
- [[02-Tech-Stack]]
- [[03-API-Specification]]
- [[04-Data-Models]]
- [[05-Implementation-Phases]]
- [[06-Obsidian-Vault-Guide]]
- [[07-Software-Prerequisites]]
- [[08-UI-Swagger-Visualization]]
