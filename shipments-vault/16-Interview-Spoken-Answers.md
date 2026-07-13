# Interview Answers — Layman + Technical (Speak These)

Use these as **spoken answers** (45–90 seconds each).  
Style: simple story first → then the technical name → why it matters.

---

## 1. Why not update everything inside the API request?

**Say this:**

> Imagine a customer asks you to update 50,000 contacts. If I do that work *inside* the API call, their browser or Postman will hang for minutes, maybe time out, and if something crashes halfway we lose track.
>
> So instead, the API only does the “reception desk” job: validate the request, create a job ticket, put it in a queue, and immediately say “accepted” (HTTP 202). A separate **worker** process is the kitchen — it picks jobs from the queue and updates people in batches.
>
> Technically that’s **async processing with BullMQ + Redis**. Benefit: API stays fast, we can retry, and we can run many workers when load grows.

---

## 2. How do you add a new bulk action like Bulk Delete?

**Say this:**

> I designed it like plug-and-play. The worker doesn’t hard-code “only bulk update.” It looks up a **handler** by name, like `contact:bulk_update`.
>
> To add Bulk Delete I would: write one new handler file with the delete logic, register it as `contact:bulk_delete`, and allow that action type in validation. The queue, progress counters, and logging stay the same.
>
> That’s the **strategy / registry pattern** — new action ≈ one module, not a rewrite.

---

## 3. How do you support Companies, Leads, etc. without rewriting?

**Say this:**

> Contacts, Companies, Leads, Opportunities, Tasks are different “drawers” in the CRM, but bulk work is similar: find matching rows, update fields, log results.
>
> So I keep an **entity registry**: each entity declares its Mongo model, which fields can be updated, and that we dedupe by email. The worker asks the registry “which collection?” instead of having five copy-pasted workers.
>
> Adding a new entity later is mostly: new model + registry entry + handler registration.

---

## 4. How does batching work? Why not one-by-one?

**Say this:**

> Updating one contact at a time would mean hundreds of thousands of tiny database trips — slow and heavy.
>
> We take a **batch** (default 500), update them together with MongoDB **`bulkWrite`**, write logs for that batch, update progress, then take the next batch. Like loading a truck instead of making 500 car trips.
>
> That’s how we aim for **thousands of entities per minute**.

---

## 5. When you filter by status and then change status — how do you not skip people?

**Say this:**

> Early on I had a bug. We filtered “inactive” people, then set them to “active.” If you page with **skip/limit**, the list shrinks as people leave “inactive,” so skip jumps over people still waiting — progress looked like 57% but the job said completed.
>
> Fix: don’t use skip while mutating the filter field. Walk by **`_id` cursor** — “give me the next 500 inactive after this id.” Everyone gets processed once.
>
> I’m happy to mention this in the Loom — it shows I debug real production-style issues.

---

## 6. How do you scale to a million rows / thousands per minute?

**Say this:**

> Three layers:
> 1. **API** — keep it thin and stateless; add more API instances behind a load balancer if traffic grows.
> 2. **Workers** — the heavy lifting. Run 2, 5, 10 worker processes; Redis/BullMQ hands each a job. That’s **horizontal scale-out**.
> 3. **Database** — indexes on `accountId`, `status`, `email`; Atlas can grow tier later.
>
> For the assignment we prove the pattern with a few thousand rows; the design is what supports millions.

---

## 7. What if one contact fails in the middle?

**Say this:**

> One bad row shouldn’t kill the whole job. Each entity gets its own log: success, failed, or skipped, with a clear error message when it fails.
>
> Counters go up: successCount, failureCount, skippedCount. If some succeed and some fail, the job ends as **`partial`**. The user can open logs, filter failed, and fix data.

---

## 8. Explain rate limiting (multiple users?)

**Say this:**

> Yes — many accounts/users can run bulk jobs. Every job has an **`accountId`** like a tenant id.
>
> We allow roughly **10,000 entity updates per minute per account**. Counters live in Redis keyed by account + minute. If Account A is heavy, Account B still has its own quota. Over limit → **429 Too Many Requests**.
>
> So it’s multi-tenant friendly, not one global choke for everyone.

---

## 9. How does email deduplication work?

**Say this:**

> Inside one bulk job, if two rows share the same email, we process the first and **skip** the rest. Skipped rows still appear in logs with a message like “Duplicate email: …”.
>
> That matches the assignment: identify duplicates on email and mark them skipped — not silently ignore them.

---

## 10. How does scheduling work?

**Say this:**

> If you pick a future time, we don’t run immediately. We store `scheduledAt`, set status to **`scheduled`** (UI shows “Future update”), and enqueue the job with a **delay** in BullMQ.
>
> When the time comes, the worker picks it up like any other job: queued → running → completed. Good for “run this campaign tonight at 11:15.”

---

## 11. Walk me through one request end-to-end (60 seconds)

**Say this:**

> User opens Create Action, chooses Contacts, filter inactive, sets status to active, clicks Queue.
>
> API validates payload and rate limit, counts how many rows match, creates a `bulk_actions` document in Mongo, pushes a job to Redis.
>
> Worker picks it up, loads contacts in batches of 500, bulk-updates them, writes per-row logs, updates progress.
>
> UI polls status every second — progress bar moves — then stats show success/failure/skipped. Swagger and Postman hit the same APIs.

---

## 12. What’s your API for stats?

**Say this:**

> `GET /bulk-actions/:id/stats` returns a summary card: total, success, failure, skipped, progress %, duration, and rough throughput per minute. The detail page shows the same numbers with a chart so non-technical reviewers see it instantly.

---

## 13. How would you secure this in production?

**Say this:**

> For the assignment I focused on the bulk engine. For production I’d add **authentication** (JWT or API keys), make sure one account can’t touch another account’s data, lock CORS to our frontend domain, keep secrets only in env vars, and tighten Atlas IP allowlist to the server instead of `0.0.0.0/0`.
>
> Showing I know the gap is better than pretending auth exists.

---

## 14. What if someone runs the same job twice?

**Say this:**

> Each job has its own id and status. If a worker sees a job already completed/failed/partial, it won’t process it again. Re-submitting from the UI creates a **new** job — which is usually what you want (“run this update again”). If we needed strict idempotency keys, we could add a client request id later.

---

## 15. Why Redis + BullMQ, not only Mongo or setTimeout?

**Say this:**

> `setTimeout` in the API dies if the server restarts. Mongo alone isn’t a great job queue. Redis + BullMQ gives us durable jobs, retries, delayed/scheduled jobs, and multiple workers competing fairly for work. That’s industry-standard for Node background jobs.

---

## Bonus: How does the multi-field form work? (they may ask after seeing UI)

**Say this:**

> Whatever you type — name, age, status — is applied as the **same new value to every matching row**. Blank fields mean “don’t change.” So it’s mass edit, not generating unique names per person. That’s normal CRM bulk update behavior. We warn users not to set one email on thousands of rows because of uniqueness.

---

## Opening line for Loom / intro

> I built a bulk action platform like a restaurant: the API takes the order, Redis is the ticket rail, workers are the kitchen cooking in batches, Mongo stores the data and receipts (logs). That keeps the system fast, observable, and easy to extend when Shipmnts adds more CRM entities or action types.

---

## Related

- [[15-Reviewer-Questions]] (short checklist version)
- [[11-Architecture-Layman]]
- [[13-Hosting-Guide]]
