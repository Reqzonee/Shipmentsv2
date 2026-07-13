# Shipmnts — Bulk Action Platform

Scalable CRM bulk-update engine with a live React dashboard.  
Queue jobs in the background, track progress in real time, inspect per-entity logs.

**Loom walkthrough:** [Watch the architecture & demo](https://www.loom.com/share/5261cc9892b6498e9c8aabe9c5ef8485)

---

## What it does

| Capability | Detail |
|------------|--------|
| **Bulk update** | Update name, email, status (and more) across matching CRM records |
| **Entities** | Contacts · Companies · Leads · Opportunities · Tasks |
| **Queue** | Redis + BullMQ — API stays fast; workers process in batches |
| **Logs & stats** | Success / failed / skipped per entity + summary API |
| **Bonuses** | Per-account rate limit · email dedup (skipped) · future scheduling |
| **UI** | Dashboard, create action, live progress, CRM browser |

---

## Quick start (local)

**Requirements:** Node 20+, Docker (Redis + optional Mongo)

```bash
# 1) Infra
docker compose up -d

# 2) Install & build shared types
npm install

# 3) Env
cp .env.example .env
# Use local Mongo by default, or set Atlas URI

# 4) Run API + worker + UI (dev)
npm run dev:all
```

| Surface | URL |
|---------|-----|
| **UI** | http://localhost:5173 |
| **API** | http://localhost:3000/api/v1 |
| **Health** | http://localhost:3000/api/v1/health |

Seed sample CRM data from the UI (**CRM Entities → Seed ALL**), then create a bulk action or use **▶ Live queue demo** on the Dashboard.

---

## Postman collection

The full collection lives in the repo — import it directly into Postman:

**File:** [`postman/bulk-actions.postman_collection.json`](./postman/bulk-actions.postman_collection.json)

1. Postman → **Import** → select that file  
2. Set `baseUrl` to `http://localhost:3000/api/v1` (or your hosted URL + `/api/v1`)  
3. Run in order: **Health → Seed ALL → Create bulk action → Status → Stats → Logs**

You do **not** need a separate Postman cloud link — reviewers can import from GitHub.

---

## API (assignment endpoints)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/bulk-actions` | List actions |
| `POST` | `/api/v1/bulk-actions` | Create / queue / schedule |
| `GET` | `/api/v1/bulk-actions/:id` | Status & progress |
| `GET` | `/api/v1/bulk-actions/:id/stats` | Success / failure / skipped |
| `GET` | `/api/v1/bulk-actions/:id/logs` | Per-entity logs (filterable) |

Also: health, entity list/seed helpers for demos.

---

## Architecture (short)

```
Browser / Postman
       │
       ▼
   Express API  ──►  MongoDB (entities, jobs, logs)
       │
       ▼
  Redis (BullMQ)
       │
       ▼
    Worker(s) ── batch bulkWrite ──► MongoDB
```

- **Horizontal scale:** run more worker processes on the same Redis queue  
- **Extensibility:** register handlers like `contact:bulk_update` — new actions without rewriting the orchestrator  

---

## Single-domain hosting

One URL serves **UI + API** together (no separate frontend host required).

```bash
npm install
npm run build          # shared + web
# set production .env (MONGODB_URI, REDIS_*, PORT)
npm run start:api      # Express serves apps/web/dist + /api/v1
npm run start:worker   # keep worker running (second process / PM2)
```

| Path | What |
|------|------|
| `https://your-domain/` | React UI |
| `https://your-domain/api/v1/...` | REST API |

UI uses relative `/api/v1` in production, so it works on one domain automatically.

**Need:** MongoDB (Atlas OK) + Redis + Node for API and Worker.

---

## How bulk field updates work

Filled fields are written to **every** matching row with the **same** value.  
Leave a field blank → that field is unchanged.

Example: filter Contacts `status=inactive`, set `status=active` → all matching contacts become active.

---

## Repo layout

```
apps/web          React + Vite UI
packages/api      Express API (also serves UI in production)
packages/worker   BullMQ consumers
packages/shared   Models, Zod, entity registry
postman/          Importable Postman collection
```

---

## License

Built for the Shipmnts technical assignment.
