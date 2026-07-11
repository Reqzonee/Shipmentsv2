# AGENT HANDOFF — Read This First

> **Purpose:** Any AI agent picking up this project after a context reset should read this file first.  
> **Update this file** at the end of every significant work session.

**Last updated:** 2026-07-11  
**Project path:** `d:\SMVS\shipments`

---

## Current Status

| Item | Status |
|------|--------|
| Planning docs | ✅ Done |
| Elevate study | ✅ Done |
| Monorepo scaffold | ✅ Done |
| Redis (Docker) | ✅ Running (`shipments-redis`) |
| Mongo local (Docker) | ✅ Running (`shipments-mongo`) — Atlas blocked by IP whitelist |
| Shared models | ✅ Contact, BulkAction, BulkActionLog |
| API + Swagger | ✅ Express on `:3000`, docs at `/docs` |
| Worker + bulk update | ✅ BullMQ + handler registry + dedup skip |
| Rate limiting | ✅ Redis per-account / minute |
| Scheduling | ✅ via BullMQ `delay` + `scheduledAt` |
| E2E verified | ✅ Seeded 500, updated 167 inactive→active |
| Postman collection | ✅ `postman/bulk-actions.postman_collection.json` |
| React UI | ✅ Dashboard / Create / Detail+charts / Contacts |
| Loom | ❌ Not started |

**Next action:** Load test 2k–5k → Loom → submit.

**UI updates (latest):** Contacts pagination + filters (status/search/age); queue progress animation on create + action detail.

---

## How to Run (right now)

```powershell
# Docker (Redis + Mongo) — docker may need full path on this machine
$env:Path = "C:\Program Files\Docker\Docker\resources\bin;" + $env:Path
docker compose up -d

npm install
npm run dev          # API + worker
npm run dev:web      # React UI on :5173
```

- API: http://localhost:3000  
- Swagger: http://localhost:3000/docs  
- UI: http://localhost:5173  
- Health: http://localhost:3000/api/v1/health  

### Atlas note
Atlas URI is in `.env` (commented). Active DB is **local Docker Mongo** because Atlas returned IP whitelist error. To use Atlas:
1. Atlas → Network Access → Add IP `0.0.0.0/0` (or current IP)
2. Uncomment Atlas `MONGODB_URI` in `.env`, comment local one
3. Restart API/worker

**Never commit `.env`** (password lives there).

---

## Locked Decisions

| Decision | Choice |
|----------|--------|
| Backend | Express + TypeScript (Elevate.Server style) |
| Queue | Redis + BullMQ |
| DB | Local Mongo for now; Atlas when whitelisted |
| Response shape | `{ isOk, message, status, data }` |
| UI | Vite + React + Tailwind + Recharts |
| Dedup | Skip duplicate emails within a job |
| Rate limit | 10k events/min per accountId |

---

## Repo Layout

```
shipments/
├── apps/web/                 ← React UI
├── packages/api/             ← Express + Swagger
├── packages/worker/          ← BullMQ worker
├── packages/shared/          ← Models, Zod, constants
├── postman/
├── docs/                     ← Obsidian vault
├── docker-compose.yml        ← redis + mongo
└── .env                      ← secrets (gitignored)
```

---

## Related Notes

- [[10-Elevate-References]]
- [[05-Implementation-Phases]]
- [[08-UI-Swagger-Visualization]]
- [[03-API-Specification]]
