# Loom Video Script — Line by Line

**Length:** around 7–8 minutes  
**How to use:** Do the **[DO THIS]** step, then read **YOU SAY**. When you explain a UI feature, also point at the matching Postman request (keep Postman open on a second window or split screen).

---

## Setup (before recording)

**[DO THIS]**
1. `docker compose up -d`
2. `npm run dev:all`
3. Open:
   - **React UI** → http://localhost:5173
   - **Postman** → import `postman/bulk-actions.postman_collection.json`
4. In the UI → **CRM Entities** → **Seed ALL** (wait for 2000)
5. Close `.env` / passwords

**Tip:** Put UI on the left half of the screen, Postman on the right. When you talk about a feature, click that request in Postman so they see the exact API.

---

## 1. Opening (0:00 – 0:50)

**[DO THIS]** Show UI dashboard. Postman collection visible on the side.

**YOU SAY:**

Hi, I'm Paraj.

This is my Bulk Action Platform for the Shipmnts assignment.

Idea is simple — in a CRM you often need to update thousands of records at once. You can't do that in one normal API call. It'll hang or time out.

So I built a queue-based system. You submit a bulk action, it goes to Redis, a worker processes it in batches, and you get progress, stats, and a log per record.

I'll demo through the **React UI** I built on top of the APIs. Alongside each screen I'll show the matching request from the **Postman collection** in the repo — so you can see exactly which endpoint powers that feature.

---

## 2. Stack + architecture (0:50 – 1:50)

**[DO THIS]** Stay on UI, or briefly show folders: `packages/api`, `packages/worker`, `apps/web`.

**YOU SAY:**

Stack — Node Express API, MongoDB, Redis with BullMQ, separate worker, React frontend.

Flow is: create action → API saves the job and pushes to Redis → returns immediately → worker updates records in batches of five hundred → writes success / failed / skipped logs → updates progress.

Need more throughput later? Run more workers on the same queue. That's how it scales.

New action type later — like bulk delete — add one handler, register it. Queue stays the same.

---

## 3. Dashboard — list bulk actions (1:50 – 2:30)

**[DO THIS]** UI: **Dashboard**. Show filters (Queued / Ongoing / Completed / Future).

**[DO THIS]** Postman: open **GET /bulk-actions — List**

**YOU SAY:**

This is the dashboard. All bulk actions for an account show up here — queued, running, completed, and scheduled ones as Future.

This screen is backed by **GET /bulk-actions**. Same thing in Postman — you can pass accountId and optionally filter by status.

So whatever you see in this list is the same data that API returns.

---

## 4. CRM Entities — browse + seed (2:30 – 3:10)

**[DO THIS]** UI: **CRM Entities**. Switch Contact / Company / Lead. Show pagination.

**[DO THIS]** Postman: **List entity types**, **List entity records**, **Seed ALL entities**

**YOU SAY:**

Here I browse CRM data — Contacts, Companies, Leads, Opportunities, Tasks. Five entity types from the assignment.

Pagination so the browser isn't loading everything.

Listing records is **GET /entities/{entityType}** with accountId.

To load test data I used Seed ALL — that's **POST /entities/seed-all**. I already seeded two thousand per entity before recording.

---

## 5. Create Action — POST bulk-actions (3:10 – 4:00)

**[DO THIS]** UI: **Create Action**. Fill slowly:

- Account: `acc_demo`
- Entity: Contact
- Filter status: `inactive`
- Update status: `active`

**[DO THIS]** Postman: open **POST /bulk-actions — Create (status update)** — show the JSON body next to the form.

**YOU SAY:**

Create Action form.

Account ID is acc_demo — every job is tied to an account. Rate limiting is also per accountId.

Entity Contact. Filter inactive. Update status to active.

Whatever I type in an update field gets applied to **every** matching row. Leave a field blank, that field doesn't change.

When I click Queue, the UI calls **POST /bulk-actions** — same body you see in Postman. API creates the job, pushes to Redis, returns the action with an ID.

**[DO THIS]** Click Queue. Show it navigating to the detail page.

---

## 6. Action detail — status, progress, stats, logs (4:00 – 5:20)

**[DO THIS]** Stay on Action Detail. Point at Queued → Processing → Done, then progress bar.

**[DO THIS]** Postman: **GET /bulk-actions/:actionId — Status**

**YOU SAY:**

This detail page polls **GET /bulk-actions/{actionId}**. That's how progress updates live — queued, processing, done.

Progress is processed over total matched.

**[DO THIS]** Point at success / failed / skipped numbers.

**[DO THIS]** Postman: **GET /bulk-actions/:actionId/stats — Stats**

**YOU SAY:**

These counts come from **GET /bulk-actions/{actionId}/stats** — success, failure, skipped. Throughput per minute is there too. Assignment asked for this endpoint specifically.

**[DO THIS]** Scroll to logs. Filter Success / Failed / Skipped.

**[DO THIS]** Postman: **GET /bulk-actions/:actionId/logs** and **GET logs — filter failed / skipped**

**YOU SAY:**

Logs — one row per entity. UI filter calls the same logs API with a status query param. In Postman that's GET logs, and there are variants for failed and skipped.

So the UI is just a face on these endpoints — nothing hidden.

---

## 7. Multi-field update (5:20 – 5:50)

**[DO THIS]** Create Action again:

- Filter: `active`
- Name: `Bulk Renamed Contact`
- Email: leave blank

**[DO THIS]** Postman: **POST /bulk-actions — Multi-field update** (show body)

**YOU SAY:**

Multi-field update — same **POST /bulk-actions**, just more fields in `updates`.

I'm setting name. Email blank, so emails stay unique. Same queue and worker path.

**[DO THIS]** Queue it. Show briefly that it runs. Optional if short on time.

---

## 8. Bonus features + Postman refs (5:50 – 6:25)

**[DO THIS]** Dashboard — show Future if you have a scheduled job, else open Postman **POST — Scheduled (future)**

**YOU SAY:**

Three optional pieces from the assignment.

Rate limit — ten thousand events per minute per accountId. Checked on create. Same POST /bulk-actions — if you're over limit, API rejects before the job starts.

Email dedup — duplicates get **skipped**, not failed. You'll see them in logs with status skipped — that GET logs filter I showed.

Scheduling — pass `scheduledAt` in the create body. Job stays scheduled until BullMQ fires it. Dashboard shows Future. In Postman that's the Scheduled request under create.

---

## 9. Postman collection wrap-up (6:25 – 6:50)

**[DO THIS]** Postman: expand the full collection tree. Run **01 Health** once.

**YOU SAY:**

Full Postman collection is in the repo — `postman/bulk-actions.postman_collection.json`. Import and run in order: Health, Seed, Create, Status, Stats, Logs.

When you create from Postman, a small test script saves actionId so Status and Stats work without copy-paste.

Everything I showed in the UI maps to these requests. Reviewers can use either.

---

## 10. Close (6:50 – 7:15)

**[DO THIS]** Back to UI dashboard.

**YOU SAY:**

That's it.

Queue-based bulk processing — batches, logs, stats. Five CRM entities. Bulk update. Rate limit, dedup, scheduling.

React UI for the happy path. Postman collection for the same APIs.

Thanks for watching — repo and Postman are in the submission. Happy to take questions.

**[DO THIS]** Stop recording.

---

## Quick map — UI feature → Postman API

| What you show in UI | Postman request |
|---------------------|-----------------|
| Dashboard list / filters | `GET /bulk-actions — List` |
| CRM Entities table | `List entity records` |
| Seed ALL | `Seed ALL entities (load test)` |
| Create Action → Queue | `POST /bulk-actions — Create` |
| Multi-field form | `POST /bulk-actions — Multi-field update` |
| Schedule / Future | `POST /bulk-actions — Scheduled (future)` |
| Detail status + progress | `GET /bulk-actions/:actionId — Status` |
| Success / fail / skipped counts | `GET /bulk-actions/:actionId/stats` |
| Logs table + filters | `GET .../logs` (+ filter failed / skipped) |
| Health (optional) | `01 Health` |

---

## If something breaks

| Problem | Say | Fix |
|---------|-----|-----|
| Stuck at 0% | "Refreshing…" | Refresh; check `npm run dev:all` |
| No matches | "Need seed data." | Seed ALL, use `acc_demo` |
| API down | "Services coming back…" | Docker + `npm run dev:all` |

Don't show `.env` on camera.

---

## Related

- [[Shipments-Vault]]
- [[14-Bulk-Update-Explained]]
