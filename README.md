# Bulk Action Platform — Shipmnts Assignment

Scalable bulk action engine for CRM entities. Node.js, Express, React, MongoDB, Redis, BullMQ.

## Quick start

```powershell
# Ensure Docker is on PATH (or use full path under Program Files\Docker\...)
docker compose up -d

npm install
npm run dev          # API :3000 + worker
npm run dev:web      # UI  :5173
```

| URL | What |
|-----|------|
| http://localhost:3000 | API |
| http://localhost:3000/docs | Swagger |
| http://localhost:5173 | React UI |
| http://localhost:3000/api/v1/health | Health |

Copy `.env.example` → `.env`. Default DB is **local Docker Mongo**. For Atlas, whitelist your IP then switch `MONGODB_URI`.

**Never commit `.env`.**

### Seed + bulk update (API)
```powershell
# Seed
Invoke-RestMethod -Method POST http://localhost:3000/api/v1/contacts/seed -ContentType application/json -Body '{"accountId":"acc_demo","count":2000}'

# Bulk update inactive → active
Invoke-RestMethod -Method POST http://localhost:3000/api/v1/bulk-actions -ContentType application/json -Body '{"accountId":"acc_demo","filters":{"status":"inactive"},"updates":{"status":"active"}}'
```

Postman: `postman/bulk-actions.postman_collection.json`

## Docs (Obsidian)

Open `docs/` as a vault. Start with `09-AGENT-HANDOFF.md`.

## Status

✅ Multi-entity CRM (Contacts, Companies, Leads, Opportunities, Tasks)  
✅ Multi-field bulk update + modular handler registry  
✅ Rate limit per accountId · email dedup · scheduling · cursor batching  
✅ Dashboard tabs (queued / ongoing / future / completed) · Entities UI · seed-all  
⚠️ Atlas: whitelist your IP then switch `.env` (see `docs/12-Gap-Closure-Research.md`)  
🚧 Loom video

## Horizontal scale (assignment)

Run more **API** instances + more **worker** processes against the same Redis queue and MongoDB. That is scale-out.
