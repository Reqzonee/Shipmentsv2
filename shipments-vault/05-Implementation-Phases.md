# Implementation Phases (2-Day Plan)

> **Timeline:** 2 days total. Backend first, frontend second, polish last.

---

## Day 1 — Backend Core (Priority)

### Phase 1: Project Setup (2–3 hours)
- [ ] Init monorepo (`pnpm workspaces` or npm workspaces)
- [ ] Docker Compose: MongoDB + Redis
- [ ] Shared types package (`packages/shared`)
- [ ] API skeleton (Fastify/Express)
- [ ] Mongoose models: Contact, BulkAction, BulkActionLog
- [ ] Seed script: generate 2,000–5,000 sample contacts

### Phase 2: Bulk Action Engine + Swagger (4–5 hours)
- [ ] BullMQ queue setup
- [ ] Worker process with batch orchestrator
- [ ] `BulkUpdateHandler` for contacts
- [ ] `POST /bulk-actions` — create + enqueue
- [ ] `GET /bulk-actions/:id` — status with progress
- [ ] `GET /bulk-actions/:id/stats` — summary counts
- [ ] `GET /bulk-actions` — list with filters
- [ ] Per-entity logging (bulk insert)
- [ ] Swagger UI at `/docs` (keep in sync while adding routes)

### Phase 3: Optional Enhancements (2–3 hours)
- [ ] Rate limiting middleware (Redis counter, 10k/min per accountId)
- [ ] Email deduplication in bulk update (mark as skipped)
- [ ] Scheduled jobs via BullMQ delay + `scheduledAt` field
- [ ] `GET /bulk-actions/:id/logs` with status filter

---

## Day 2 — Frontend, Testing, Submission

### Phase 4: React Frontend + Viz (3–5 hours)
- [ ] Vite + React + Tailwind + shadcn/ui setup
- [ ] **Dashboard:** list bulk actions with status badges + mini progress
- [ ] **Create Action:** form (filters, updates, schedule, accountId)
- [ ] **Action Detail:** live polling, progress bar, stats cards, outcome chart (Recharts)
- [ ] **Logs:** filterable table (success/failed/skipped)
- [ ] **Contacts:** table + seed button
- [ ] Nav link to Swagger `/docs`
- See [[08-UI-Swagger-Visualization]]

### Phase 5: Testing & Performance (2 hours)
- [ ] Load test: run bulk update on 2,000–5,000 contacts
- [ ] Verify throughput (target: thousands/minute)
- [ ] Test rate limit rejection
- [ ] Test dedup skipping
- [ ] Test scheduled action

### Phase 6: Documentation & Submission (2–3 hours)
- [ ] README: setup, architecture diagram, env vars
- [ ] Postman collection (all endpoints + example payloads)
- [ ] Loom video script (see below)
- [ ] Record Loom: architecture + live demo
- [ ] Final review of all assignment requirements

---

## Loom Video Script (5–8 minutes)

1. **Problem recap** (30 sec) — what a bulk action platform is
2. **Architecture diagram** (2 min) — API → Queue → Worker → MongoDB
3. **Code walkthrough** (2 min) — handler registry, worker batch loop, extensibility
4. **Live demo** (2 min):
   - Seed contacts
   - Create bulk update via UI or Postman
   - Show progress updating
   - Show stats + logs
   - (Bonus) show rate limit or scheduled action
5. **Scalability story** (1 min) — horizontal workers, batch size, indexes
6. **Future enhancements** (30 sec) — new entities, new action types

---

## Priority Order (If Running Out of Time)

| Priority | Item | Must Have? |
|----------|------|------------|
| P0 | POST/GET bulk-actions endpoints | Yes |
| P0 | Worker + batch processing + bulk update | Yes |
| P0 | Stats endpoint + per-entity logs | Yes |
| P0 | Postman collection | Yes |
| P0 | Loom video | Yes |
| P1 | Rate limiting | Bonus |
| P1 | Dedup by email | Bonus |
| P1 | Scheduling | Bonus |
| P2 | React frontend | Not required but we build it |
| P2 | Load test numbers in README | Impressive |

---

## Related Notes

- [[00-Assignment-Overview]]
- [[06-Obsidian-Vault-Guide]]
