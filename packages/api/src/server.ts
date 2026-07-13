import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { connectDB } from '@shipments/shared';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await connectDB(env.mongodbUri);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.use('/api/v1', routes);

  // Single-domain: serve React build from the same origin as the API
  const webDist = path.resolve(__dirname, '../../../apps/web/dist');
  const hasWeb = fs.existsSync(path.join(webDist, 'index.html'));

  if (hasWeb) {
    app.use(express.static(webDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(webDist, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.json({
        isOk: true,
        message: 'Shipmnts Bulk Action Platform API',
        status: 200,
        data: {
          health: '/api/v1/health',
          ui: 'Run npm run build && npm run start:api to serve UI on this domain',
          version: '1.0.0',
        },
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`Health: http://localhost:${env.port}/api/v1/health`);
    if (hasWeb) {
      console.log(`UI (same domain): http://localhost:${env.port}/`);
    }
  });
}

main().catch((err) => {
  console.error('Failed to start API', err);
  process.exit(1);
});
