# AGENT HANDOFF — Read This First

**Last updated:** 2026-07-11 (gap closure + multi-entity)  
**Project path:** `d:\SMVS\shipments`

---

## Current Status

| Item | Status |
|------|--------|
| Multi-entity CRM | ✅ contact, company, lead, opportunity, task |
| Multi-field bulk update | ✅ name, email, status, and entity-specific fields |
| Handler registry | ✅ `entityType:bulk_update` × 5 |
| Cursor batching (no skip bug) | ✅ |
| Dashboard filters + Future badge | ✅ |
| Entities UI + seed-all | ✅ |
| Rate limit per accountId | ✅ 10k/min |
| Email dedup → skipped | ✅ |
| Atlas | ⚠️ DNS OK; **IP whitelist required** — current public IP `223.228.4.122` |
| Active DB right now | Local Docker Mongo (so app works) |
| Loom | ❌ |

**Next:** Whitelist Atlas IP → flip `.env` to Atlas → deploy API+worker+Redis on server → Loom.

---

## Atlas for server hosting

1. Atlas → **Network Access** → Add IP `223.228.4.122` (this machine) **and** your **server IP** (or `0.0.0.0/0` for demo)
2. In `.env` uncomment Atlas URI, comment local
3. Redis still required on server (Docker or managed)
4. Run: `npm run build -w @shipments/shared && npm run dev` (or process manager for api + worker)

Node already forces DNS `8.8.8.8` / `1.1.1.1` for `mongodb+srv` ([docs](https://www.mongodb.com/docs/drivers/node/current/connect/connection-troubleshooting/)).

---

## Multi-account rate limit

Yes — many users/accounts. Each job has `accountId`. Limit is **per accountId**, not global. Account A and Account B each get 10k events/min.

---

## How to add a new bulk action later

1. Add handler class implementing `BulkActionHandler`
2. `registry.set('contact:bulk_delete', handler)`
3. Extend Zod `ACTION_TYPES` + API validation  
Worker orchestrator stays unchanged.

---

## Related

- [[12-Gap-Closure-Research]]
- [[11-Architecture-Layman]]
- [[05-Implementation-Phases]]
