# Tech Stack

## Recommended Stack (Your Choice + Our Additions)

You suggested **Node + React + MongoDB**. That is an excellent fit. Here is the full stack with rationale.

---

## Core Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Backend Runtime** | Node.js 20 LTS | Async I/O ideal for I/O-heavy batch processing; same language as frontend |
| **Backend Framework** | **Express.js** | Matches Elevate.Server structure (routes → controllers); Swagger via swagger-jsdoc |
| **Language** | TypeScript | Type safety for handler interfaces, shared types between API/worker/frontend |
| **Database** | **MongoDB Atlas** (`MONGODB_URI` in `.env`) | Cloud cluster; same Mongoose patterns as Elevate.Server |
| **ODM** | Mongoose | Schema validation, middleware, indexes |
| **Job Queue** | **Redis + BullMQ** | Industry standard for Node; delayed jobs (scheduling), retries, concurrency control, horizontal workers |
| **Frontend** | React 18 + Vite | Fast dev, modern tooling |
| **UI Library** | Tailwind CSS + shadcn/ui | Polished CRM-style demo UI |
| **Charts** | Recharts | Progress / outcome visualizations |
| **API Docs** | `@fastify/swagger` + Swagger UI | Live docs at `/docs` (plus Postman collection) |
| **Validation** | Zod | Shared schemas between API and worker via `packages/shared` |

---

## Why These Additions Beyond Node/React/MongoDB

### Redis + BullMQ (Critical — not optional)
The assignment explicitly mentions **queuing systems**. You cannot meet scalability requirements with in-process async alone.

- **BullMQ** handles: job persistence, retries, delayed/scheduled jobs, worker concurrency, progress events
- **Redis** is the backing store — lightweight, fast, supports rate limiting counters too

Without a queue:
- API would block or use fragile in-memory processing
- No horizontal worker scaling
- No scheduling support
- No retry on failure

### TypeScript (Strongly Recommended)
- Shared `BulkActionHandler` interface across API + worker
- Catch payload validation bugs at compile time
- Better evaluator impression for a 2-day assignment

### Docker Compose (Dev Experience)
- One command to spin up MongoDB + Redis
- Evaluator can run your project easily

---

## Stack Diagram

```
┌─────────────────────────────────────────────────┐
│  React + Vite + Tailwind  (apps/web)            │
└────────────────────┬────────────────────────────┘
                     │ HTTP / REST
┌────────────────────▼────────────────────────────┐
│  Node.js + Fastify/Express  (packages/api)    │
│  Zod validation · Rate limiter middleware       │
└────────┬───────────────────────┬────────────────┘
         │ enqueue              │ read/write
┌────────▼────────┐    ┌────────▼────────────────┐
│  Redis          │    │  MongoDB                 │
│  BullMQ queues  │    │  contacts                │
│  Rate counters  │    │  bulk_actions            │
└────────┬────────┘    │  bulk_action_logs        │
         │ dequeue     └────────▲────────────────┘
┌────────▼────────┐             │
│  Worker process │─────────────┘
│  (packages/worker)             │
│  Batch processor + handlers    │
└────────────────────────────────┘
```

---

## Alternatives Considered (And Why We Didn't Pick Them)

| Alternative | Why Not (For This Assignment) |
|-------------|-------------------------------|
| PostgreSQL | Great DB, but MongoDB's flexible schema + bulkWrite fits CRM entities better; assignment says "choose any" |
| RabbitMQ | Heavier setup; BullMQ is more ergonomic for Node |
| AWS SQS + Lambda | Over-engineered for 2-day assignment; harder local demo |
| Sidekiq (Ruby) | You chose Node |
| Celery (Python) | You chose Node |
| Prisma + PostgreSQL | Valid, but adds ORM overhead for bulk operations |
| Socket.io for progress | Nice-to-have; polling is sufficient for assignment scope |

---

## Production-Grade Extensions (Mention in Loom, Don't Build)

| Tool | Purpose |
|------|---------|
| Kubernetes / ECS | Scale API + worker pods |
| MongoDB Atlas | Managed DB with auto-scaling |
| Redis Cluster / ElastiCache | HA queue backing |
| Prometheus + Grafana | Metrics (jobs/min, latency, error rate) |
| OpenTelemetry | Distributed tracing across API → queue → worker |
| NGINX / ALB | Load balance stateless API instances |

---

## Package Versions (Target)

```json
{
  "node": ">=20",
  "mongoose": "^8",
  "bullmq": "^5",
  "ioredis": "^5",
  "fastify": "^4",
  "zod": "^3",
  "react": "^18",
  "vite": "^5"
}
```

---

## Related Notes

- [[01-Architecture-Plan]]
- [[05-Implementation-Phases]]
