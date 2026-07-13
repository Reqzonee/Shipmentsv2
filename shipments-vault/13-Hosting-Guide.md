# Hosting Guide (Server + Atlas + Redis)

Use this when deploying the Shipmnts Bulk Action Platform.

---

## Architecture on a server

```
Internet → React (static / Nginx) → API (Node) → Redis (BullMQ)
                                      ↓              ↓
                                   MongoDB Atlas   Worker (Node)
```

You need **3 long-running pieces**:
1. **API** (`packages/api`)
2. **Worker** (`packages/worker`) — can run multiple copies for scale-out
3. **Redis** — Docker on the VPS or managed Redis

MongoDB = **Atlas** (recommended for production).

---

## 1. Atlas setup

1. Atlas → **Network Access** → allow:
   - Your laptop IP (for local testing)
   - **Server public IP**
   - Or `0.0.0.0/0` for a short demo only
2. Database User with password (URL-encode `@` as `%40`)
3. Connection string example:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/shipments?retryWrites=true&w=majority
```

Node already sets DNS `8.8.8.8` / `1.1.1.1` for `mongodb+srv` on Windows/some hosts.

---

## 2. Server `.env`

```env
MONGODB_URI=mongodb+srv://...
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PORT=3000
NODE_ENV=production
RATE_LIMIT_PER_MINUTE=10000
BATCH_SIZE=500
```

For the React UI, set API URL at build time:

```env
# apps/web/.env.production
VITE_API_URL=https://api.yourdomain.com/api/v1
```

**Never commit `.env`.**

---

## 3. Install & build on server

```bash
git clone <your-repo>
cd shipments
npm install
npm run build -w @shipments/shared

# Redis
docker compose up -d redis
# (optional local mongo only if not using Atlas)
```

---

## 4. Run API + Worker (PM2 example)

```bash
npm install -g pm2

pm2 start "npx tsx packages/api/src/server.ts" --name shipments-api
pm2 start "npx tsx packages/worker/src/index.ts" --name shipments-worker

# Scale workers for higher throughput
pm2 scale shipments-worker 3

pm2 save
pm2 startup
```

Or Docker: run two containers (api, worker) sharing Redis + env.

---

## 5. Frontend

```bash
cd apps/web
npm install
npm run build
# Serve apps/web/dist with Nginx / Cloudflare / Vercel
```

Nginx sketch:

```nginx
server {
  listen 80;
  server_name app.yourdomain.com;
  root /var/www/shipments-web/dist;
  location / { try_files $uri /index.html; }
}

server {
  listen 80;
  server_name api.yourdomain.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}
```

Enable CORS is already on in the API; lock origins in production if needed.

---

## 6. Postman after deploy

1. Import `postman/bulk-actions.postman_collection.json`
2. Set collection variable `baseUrl` to `https://api.yourdomain.com/api/v1`
3. Run: Health → Seed ALL → Create bulk update → Stats / Logs

---

## 7. Smoke test checklist

- [ ] `GET /api/v1/health` → mongo + redis `up`
- [ ] Seed entities
- [ ] Create bulk update → status goes queued → running → completed
- [ ] Stats show success/failure/skipped
- [ ] UI dashboard shows job + progress
- [ ] Second accountId has its own rate-limit bucket

---

## Scale-out (assignment talking point)

| Bottleneck | Scale by |
|------------|----------|
| More API traffic | More API processes behind load balancer |
| Slow bulk jobs | More worker processes (`pm2 scale`) |
| Queue | Larger Redis |
| Data | Atlas tier / indexes (already on accountId + status + email) |

---

## Related

- [[14-Bulk-Update-Explained]]
- [[12-Gap-Closure-Research]]
- [[09-AGENT-HANDOFF]]
