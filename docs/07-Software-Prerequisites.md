# Software Prerequisites — What to Install

> Install these **before** coding. Everything else runs via Docker or npm.

---

## Required (Must Install)

| Software | Version | Why | Download |
|----------|---------|-----|----------|
| **Node.js** | 20 LTS or 22 LTS | Runtime for API, worker, React | https://nodejs.org |
| **Git** | Latest | Version control | https://git-scm.com |
| **Docker Desktop** | Latest | Runs MongoDB + Redis locally without manual installs | https://www.docker.com/products/docker-desktop |
| **Obsidian** | Latest | Project vault / notes | https://obsidian.md |

### After Node install, verify:
```powershell
node -v    # should be v20.x or v22.x
npm -v     # comes with Node
```

### Optional but recommended package manager:
```powershell
npm install -g pnpm
# or use npm workspaces — either is fine
```

---

## Required via Docker (Do NOT install separately)

Once Docker Desktop is running, these start with `docker compose up -d`:

| Service | Port | Purpose |
|---------|------|---------|
| **MongoDB** | 27017 | Primary database |
| **Redis** | 6379 | BullMQ job queue + rate limit counters |

You do **not** need to install MongoDB or Redis on Windows directly.

---

## Strongly Recommended (Dev / Demo Tools)

| Software | Why | Download |
|----------|-----|----------|
| **Postman** | Assignment requires a Postman collection; also for manual API testing | https://www.postman.com/downloads |
| **VS Code / Cursor** | Already using Cursor — good | — |
| **Loom** (or similar) | Assignment requires architecture + demo video | https://www.loom.com |

---

## Optional (Nice to Have)

| Software | Why |
|----------|-----|
| **MongoDB Compass** | Visual DB browser (inspect contacts, actions, logs) — https://www.mongodb.com/products/compass |
| **Redis Insight** | Visual Redis browser (queues, rate keys) — https://redis.io/insight |
| **Bruno / Insomnia** | Alternative to Postman if preferred |

---

## What You Do NOT Need

| Skip | Reason |
|------|--------|
| MongoDB Windows installer | Use Docker |
| Redis Windows installer | Use Docker |
| Kubernetes / Minikube | Overkill for 2-day assignment |
| AWS / cloud accounts | Local Docker is enough |
| Nginx | Vite + Node local ports are fine |

---

## Quick Setup Checklist

- [ ] Install Node.js 20+ LTS
- [ ] Install Git
- [ ] Install Docker Desktop → start it → wait until whale icon is steady
- [ ] Install Obsidian → open `d:\SMVS\shipments\docs` as vault
- [ ] Install Postman
- [ ] Create Loom account (for Day 2 video)
- [ ] (Optional) MongoDB Compass + Redis Insight

### Verify Docker works:
```powershell
docker --version
docker compose version
```

---

## Ports We Will Use

| Port | Service |
|------|---------|
| 3000 | API (Node) |
| 5173 | React frontend (Vite) |
| 27017 | MongoDB |
| 6379 | Redis |
| 3000/docs | Swagger UI (served by API) |

---

## Related Notes

- [[02-Tech-Stack]]
- [[08-UI-Swagger-Visualization]]
- [[09-AGENT-HANDOFF]]
- [[06-Obsidian-Vault-Guide]]
