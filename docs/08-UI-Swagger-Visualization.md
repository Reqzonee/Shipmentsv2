# UI, Visualization & Swagger Docs

> Decision locked: **Clean, impressive UI + live visualizations + Swagger** — even though UI is optional in the PDF.

---

## Why This Matters

Assignment says API-only is enough. We still build a polished frontend because:
1. Loom demo looks 10x better with a real product UI
2. Progress / stats / logs are easier to *show* than describe
3. Swagger proves API professionalism alongside Postman

---

## Frontend Goals (Impress Bar)

### Design Direction
- Clean ops/CRM dashboard — not a marketing landing page
- Clear hierarchy: actions list → create → detail with live progress
- Status colors: queued (gray), running (blue), completed (green), failed (red), skipped (amber)
- Dark sidebar + light content OR cohesive light theme — pick one and stick to it
- Use **Tailwind + shadcn/ui** for speed + polish
- Expressive but professional fonts (e.g. Geist / DM Sans) — avoid default Inter-only look if easy

### Pages

| Page | Purpose | Visuals |
|------|---------|---------|
| **Dashboard** | List all bulk actions | Status badges, progress mini-bars, filters |
| **Create Bulk Action** | Form: filters, fields to update, schedule, accountId | Clean form, validation feedback |
| **Action Detail** | Live progress for one job | Big progress bar, stats cards, throughput |
| **Logs** | Per-entity outcomes | Filterable table: success / failed / skipped |
| **Contacts** | Seed data browser | Simple table + seed button |
| **API Docs link** | Open Swagger | Header/nav link to `/docs` |

### Visualizations (Must Have)

| Chart / Widget | Where | What it shows |
|----------------|-------|---------------|
| Progress bar + % | Action Detail | Real-time processed / total |
| Stats cards | Action Detail | Success / Failure / Skipped counts |
| Donut or pie | Action Detail | Outcome distribution |
| Throughput line (optional) | Action Detail | Records/min over time (if we store snapshots) |
| Status breakdown | Dashboard | Count of queued / running / completed |

**Library:** Recharts (simple, React-friendly) or lightweight CSS for progress + cards if time is tight.

### Live Updates
- Poll `GET /bulk-actions/:id` every **2 seconds** while status is `queued` or `running`
- Stop polling when `completed` / `failed` / `partial`
- Optional later: SSE/WebSocket — not required for assignment

---

## Swagger / OpenAPI

### Approach
- Generate OpenAPI from Fastify schemas **or** maintain `openapi.yaml` + serve with `@fastify/swagger` + `@fastify/swagger-ui`
- Live docs at: `http://localhost:3000/docs`
- Keep in sync with [[03-API-Specification]]

### What Swagger Must Cover
- All required endpoints (`/bulk-actions`, status, stats)
- Logs endpoint
- Contacts seed/list helpers
- Example request bodies for bulk update
- Error responses: 400, 404, 429

### Deliverable Pairing
| Artifact | Audience |
|----------|----------|
| **Swagger UI** | Interactive try-it-out during Loom |
| **Postman collection** | Assignment mandatory deliverable |
| **openapi.yaml** | Source of truth (optional export from Swagger) |

---

## UI Implementation Order (Day 2)

1. Shell layout (nav + pages)
2. Dashboard list
3. Create action form
4. Action detail + progress polling + stats cards
5. Logs table with filters
6. Charts (donut + progress)
7. Link to Swagger in nav
8. Polish: empty states, loading skeletons, error toasts

---

## Impression Checklist (Before Loom)

- [ ] Create a bulk update from UI and watch progress move live
- [ ] Show stats cards updating
- [ ] Filter logs by failed / skipped
- [ ] Open Swagger, hit an endpoint live
- [ ] Mention Postman collection in video
- [ ] UI does not look like a default Vite starter

---

## Related Notes

- [[05-Implementation-Phases]]
- [[03-API-Specification]]
- [[02-Tech-Stack]]
- [[09-AGENT-HANDOFF]]
