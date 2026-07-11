import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from '@shipments/shared';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

async function main() {
  await connectDB(env.mongodbUri);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.get('/', (_req, res) => {
    res.json({
      isOk: true,
      message: 'Shipmnts Bulk Action Platform API',
      status: 200,
      data: {
        docs: '/docs',
        health: '/api/v1/health',
        version: '1.0.0',
      },
    });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    console.log(`Swagger UI: http://localhost:${env.port}/docs`);
  });
}

main().catch((err) => {
  console.error('Failed to start API', err);
  process.exit(1);
});
