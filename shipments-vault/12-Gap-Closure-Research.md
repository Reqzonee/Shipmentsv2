# Assignment Gap Closure + Atlas + Multi-Entity

*Generated: 2026-07-11 | Confidence: High (code verified) / Medium (Atlas IP depends on your Network Access)*

## Executive Summary

Shipmnts requires a modular bulk-action platform for many CRM entities, multi-field updates, batching, scale-out, per-entity logs/stats, rate limits per account, email dedup, and scheduling. We expanded the codebase from Contact-only to **Contacts, Companies, Leads, Opportunities, Tasks**, with a **registry** so new actions/entities plug in. Atlas connects from Node after SRV DNS fix, but **IP whitelist** must include your machine/server (Compass can work while Node is still blocked).

## Atlas vs Compass

| Check | Result |
|-------|--------|
| SRV DNS from Node (with `dns.setServers(['8.8.8.8','1.1.1.1'])`) | Resolves |
| Atlas TCP from this environment | **Blocked — IP not whitelisted** ([MongoDB docs](https://www.mongodb.com/docs/drivers/node/current/connect/connection-troubleshooting/)) |
| Compass | You confirmed works |

**Why Compass ≠ Node:** same credentials, but Atlas Network Access must allow the client IP. If Compass used a different network/VPN earlier, or Atlas auto-added an IP that later changed, Node fails with whitelist error.

**Production / server:** add the **server’s public IP** (or `0.0.0.0/0` for demo only) in Atlas → Network Access, then set:

```env
MONGODB_URI=mongodb+srv://parajbhatt:Paraj%401111@cluster0.w9a8pbe.mongodb.net/shipments?retryWrites=true&w=majority
```

## Multi-account rate limiting (your question)

**Yes — multiple users/accounts are expected.** Each bulk action has an `accountId`. Rate limit keys are `rate:{accountId}:{minute}`. Each account gets **10k events/minute**; accounts do not share one global bucket.

## Horizontal scale-out

| Layer | How you scale |
|-------|----------------|
| API | Run more Node API processes behind a load balancer (stateless) |
| Worker | Run more `packages/worker` processes — BullMQ distributes jobs |
| Redis | Managed Redis / larger instance |
| MongoDB | Atlas cluster tier / sharding by `accountId` at large scale |

## What we implemented vs assignment

| Requirement | Status |
|-------------|--------|
| Contacts, Companies, Leads, Opportunities, Tasks | ✅ Entity registry + models + UI |
| Bulk update multiple fields (name, email, status, …) | ✅ Per-entity updatable fields |
| Batch processing | ✅ Cursor batches (fixed skip bug) |
| Thousands/minute + large seed | ✅ Seed up to 10k–50k; seed-all |
| Per-entity success/error logs | ✅ + clearer error strings |
| Stats API + frontend | ✅ Action detail KPIs + chart |
| Queued / ongoing / completed / **future scheduled** | ✅ Dashboard tabs + Future badge |
| Filter logs in UI | ✅ Status filter on detail |
| Modular new bulk actions | ✅ Handler registry `entity:action` |
| Rate limit 10k/min per accountId | ✅ Redis middleware |
| Email dedup → skipped logs | ✅ Within job by email |

## Sources

1. [MongoDB Node connection troubleshooting](https://www.mongodb.com/docs/drivers/node/current/connect/connection-troubleshooting/) — IP access list
2. [querySrv / DNS setServers guidance](https://stackoverflow.com/questions/79873598/mongodb-atlas-srv-connection-fails-with-querysrv-econnrefused-after-switching-no) — Windows Node DNS
3. Shipmnts assignment PDF — original requirements

## Methodology

Checked current codebase gaps against the PDF; verified Atlas connect from Node; implemented multi-entity registry end-to-end.
