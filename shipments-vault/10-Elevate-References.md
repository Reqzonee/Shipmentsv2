# Elevate Codebase References

> Studied before implementation. We **borrow structure & UX patterns**, not copy the whole stack.

**Paths:**
- Admin UI: `D:\Paraj Bhatt\jimishpatle\ele\Elevate.Admin`
- Server: `D:\Paraj Bhatt\jimishpatle\ele\Elevate.Server`
- Elly (AI): `D:\Paraj Bhatt\jimishpatle\ele\Elevate.Elly`

---

## What Each Project Is

| Project | Stack | Relevance to Shipmnts |
|---------|-------|------------------------|
| **Elevate.Admin** | CRA + Reactstrap/Bootstrap (Velzon theme) | **UI/UX reference** — lists, detail, stats, queues |
| **Elevate.Server** | npm workspaces + Express ESM + Mongoose + Swagger + RabbitMQ | **Backend structure** — routes/controllers/models, Swagger, env |
| **Elevate.Elly** | Python FastAPI + LangGraph | **Server concepts only** — status enums, audit logs, rate caps |

---

## What We Will Reuse

### From Elevate.Server (coding structure)

| Pattern | How we adapt |
|---------|----------------|
| npm workspaces monorepo | `packages/api`, `packages/worker`, `packages/shared`, `apps/web` |
| `routes → controllers → models` | Same layering in API package |
| Swagger via JSDoc / swagger-ui | Fastify Swagger or Express swagger-jsdoc at `/docs` |
| Response envelope `{ isOk, message, status, data }` | Use this shape for familiarity + consistency |
| `MONGODB_URI` from `.env` | Atlas connection string (never commit password) |
| Shared models package | `packages/shared` for types + schemas |
| Worker as separate process | BullMQ worker (Elevate uses RabbitMQ — we keep BullMQ) |

**Best Server reference files:**
- `Elevate.Server\services\cms\routes\department.routes.js`
- `Elevate.Server\services\cms\controllers\DepartmentController.js`
- `Elevate.Server\shared\models\Department.js`
- `Elevate.Server\shared\config\database.js`
- `Elevate.Server\shared\config\env.js`
- `Elevate.Server\shared\middlewares\errorHandler.js`
- `Elevate.Server\services\cms\config\swagger.config.js`

### From Elevate.Admin (UI reference)

| Screen pattern | Elevate file | Our page |
|----------------|--------------|----------|
| Clean list + filters | `SamplePlayer\SamplePlayerList.js` | Bulk Actions dashboard |
| Detail + back + cards | `SamplePlayer\SamplePlayerDetail.js` | Action detail |
| Form + validation | `SamplePlayer\SamplePlayerForm.js` | Create bulk action |
| Status chips + queue | `Tips\TipsList.js` | Actions by status |
| Timeline / progress | `Tips\TipTimeline.js` | Job progress |
| Stats KPI cards | `Reputation\ReputationDashboard.js`, `RiskSignals\RiskSignalQueue.js` | Stats strip |
| Charts | `Notifications\NotificationStats.js` (Recharts) | Outcome donut / throughput |
| Action workspace | `Transactions\RefundDecisionWorkspace.js` | Create + monitor flow |

**Shell/API wiring:**
- `Layouts\index.js` — sidebar + header chrome (inspire layout, rebuild in Tailwind/shadcn)
- `helpers\api_helper.js` + `config\apiEndpoints.js` — centralized API client pattern
- `Components\Common\BreadCrumb.js`, `DeleteModal.js`

### From Elevate.Elly (concepts only)

| Concept | Adapt to |
|---------|----------|
| Status enums (`pending → … → failed/skipped`) | `queued → running → completed/failed/partial` |
| Audit / action logs with before/after | `bulk_action_logs` |
| Volume / rate caps | Redis rate limit per `accountId` |
| Async create → poll status | `POST /bulk-actions` → `GET /bulk-actions/:id` |

**Do not port:** LangGraph, Python FastAPI, HITL approval agents.

---

## What We Will NOT Copy

| Skip | Why |
|------|-----|
| CRA + Reactstrap + Velzon SCSS | We use Vite + React + Tailwind + shadcn (cleaner, faster for 2-day build) |
| RabbitMQ | Assignment-friendly BullMQ + Redis (scheduling/retries built-in) |
| Fat 1400-line Master CRUD pages | Prefer SamplePlayer-sized modules |
| Formik-in-package-but-unused | Use controlled forms or React Hook Form |
| Cognito / multi-microservice gateway | Single API + worker is enough for assignment |
| Elly LLM stack | Out of scope |

---

## Locked Hybrid Stack (Elevate-inspired)

```
Elevate.Server structure  +  Our stack choices  +  Elevate.Admin UX
─────────────────────────────────────────────────────────────────
npm workspaces            Node + TS (or JS ESM)   List/Detail/Stats
routes → controllers      Express OR Fastify      Status chips
shared models             Mongoose                Recharts
Swagger /api-docs         BullMQ + Redis          Progress bars
{ isOk, data } responses  MongoDB Atlas           Clean forms
.env MONGODB_URI          Vite React Tailwind     KPI cards
```

**Language note:** Elevate is JS ESM. Our plan preferred TypeScript.  
**Decision for implementation:** Prefer **TypeScript** for quality; if scaffolding speed matters, use **JS ESM** matching Elevate.Server. Confirm at scaffold time — default = **TypeScript**.

---

## MongoDB Atlas

- User provides: `mongodb+srv://parajbhatt:<db_password>@cluster0.w9a8pbe.mongodb.net/`
- Store only in `.env` as `MONGODB_URI=...` (with real password + DB name, e.g. `/bulk_actions`)
- **Never commit** `.env` or passwords to git / Obsidian notes
- Docker Mongo optional for offline; **primary DB = Atlas**
- Redis still via **Docker Desktop** (BullMQ)

---

## Related Notes

- [[09-AGENT-HANDOFF]]
- [[02-Tech-Stack]]
- [[08-UI-Swagger-Visualization]]
- [[07-Software-Prerequisites]]
