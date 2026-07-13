# Assignment Reviewer Lens — Questions & Selection Odds

*How a Shipmnts reviewer would evaluate this submission, and how to answer.*

---

## What they expect (scoring mental model)

| Area | Weight | What “good” looks like |
|------|--------|------------------------|
| Architecture | High | Queue + workers, batching, modular handlers, clear scale-out story |
| Correctness | High | Bulk update works; progress/stats/logs accurate; no silent data loss |
| Extensibility | High | New entity / new action = small change, not rewrite |
| APIs + docs | Medium | Required endpoints, Postman, Loom walkthrough |
| Bonus | Medium | Rate limit, dedup, scheduling (implemented + explained) |
| Production thinking | Medium | Indexes, retries, horizontal workers, Atlas/Redis deploy |
| UI | Low–Medium | Optional in PDF; strong demo = higher confidence |

---

## Questions they will likely ask (prepare answers)

### 1. Why not update everything inside the API request?
**Expect:** Blocking HTTP for 1M rows is bad; use queue; return 202; worker processes async.

**You have:** Express API enqueues BullMQ job; worker processes batches.

### 2. How do you add a new bulk action (e.g. Bulk Delete)?
**Expect:** Strategy/handler registry; no change to orchestrator loop.

**You have:** `GenericBulkUpdateHandler` + registry keys `entity:bulk_update`. Say: “Add handler, register `contact:bulk_delete`, extend Zod ACTION_TYPES.”

### 3. How do you support Companies / Leads without rewriting?
**Expect:** Entity-agnostic design.

**You have:** `ENTITY_REGISTRY` maps type → model + fields + dedupe field.

### 4. How does batching work? Why not update one-by-one?
**Expect:** `bulkWrite`, batch size (500), fewer round-trips.

**You have:** Cursor by `_id`, batch size from env, Mongo `bulkWrite`.

### 5. You update `status` in the filter — how do you avoid skipping rows?
**Expect:** Don’t use `skip` while mutating filter fields; use `_id` cursor.

**You have:** Fixed this bug; mention the old skip bug in Loom — shows debugging maturity.

### 6. How do you scale to a million entities / thousands per minute?
**Expect:** More worker processes; same Redis queue; indexes; maybe shard later.

**You have:** Horizontal workers story in hosting guide; indexes on accountId/status/email.

### 7. What happens when one entity fails mid-batch?
**Expect:** Log failure, continue others; job can be `partial`.

**You have:** Per-entity logs success/failed/skipped; status `partial`.

### 8. Explain rate limiting.
**Expect:** Per `accountId`, events ≈ entities touched, Redis counter, 429.

**You have:** Redis minute bucket `rate:{accountId}:{minute}`; multi-tenant correct.

### 9. How does email deduplication work?
**Expect:** Skip duplicates in job; log as skipped.

**You have:** In-job `seenEmails` Set; skipped logs with message.

### 10. How does scheduling work?
**Expect:** Delayed job / cron; status `scheduled` until fire time.

**You have:** BullMQ `delay` + `scheduledAt`; UI “Future update” badge.

### 11. Why Redis + BullMQ instead of only Mongo / setTimeout?
**Expect:** Persistence, retries, concurrency, delayed jobs, multi-worker.

### 12. What’s your API contract for stats?
**Expect:** success / failure / skipped counts (+ duration/throughput is bonus).

**You have:** `/bulk-actions/:id/stats` + UI cards/chart.

### 13. How would you secure this in production?
**Expect:** Auth (JWT), account isolation, don’t expose open CORS, secrets in env, Atlas IP lock later, validate payloads.

**Gap to mention honestly:** No auth yet — “assignment scoped to bulk engine; next step JWT + account scoping.”

### 14. Idempotency / re-running the same job?
**Expect:** Awareness — re-queue could double-apply; job id / status guards.

**You have:** Worker skips if already completed/failed/partial.

### 15. Walk me through a request end-to-end.
**Practice 60-second story:** UI → POST → validate + rate limit → count matches → Mongo bulk_action doc → Redis queue → worker batches → logs + counters → UI polls status/stats.

---

## What increases selection chances (checklist)

### Already strong (keep highlighting in Loom)
- [x] Async queue architecture
- [x] Modular entity + handler registry
- [x] Multi-field bulk update
- [x] Multi-entity CRM surface
- [x] Per-entity logs + stats API + UI
- [x] Rate limit, dedup, scheduling
- [x] Cursor batching fix story
- [x] Postman + Swagger + hosting docs
- [x] Horizontal scale narrative

### Do before submit (biggest remaining lifts)
- [ ] **Loom video** (architecture diagram + live demo + scale story) — mandatory feel
- [ ] Confirm **Atlas** works after `0.0.0.0/0` (wait 1–2 min; Status = Active)
- [ ] Seed **2k–5k**, run bulk update, quote **throughput/min** from stats in Loom
- [ ] README “How to run” so reviewer clones without pain
- [ ] Mention known gap: **no auth** (shows honesty)

### Nice-to-haves if time
- [ ] Simple JWT / API key stub
- [ ] Load-test numbers table in README
- [ ] Dockerfile for api + worker

---

## Honest selection odds framing

| If you submit… | Impression |
|----------------|------------|
| API only, weak architecture | Low |
| Queue + logs + stats + Postman + Loom | **Competitive** |
| Above + modular multi-entity + bonuses + clear scale talk | **Strong** |
| Strong code but no Loom / broken setup | Risks rejection on “can’t evaluate” |

Your codebase is in the **strong** bucket if Loom + Atlas + clean run instructions land.

---

## Related

- [[16-Interview-Spoken-Answers]] ← **full spoken answers (layman + technical)**
- [[13-Hosting-Guide]]
- [[09-AGENT-HANDOFF]]
- [[01-Architecture-Plan]]
