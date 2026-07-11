import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendOk, sendFail } from '../middleware/errorHandler.js';
import { getRedisConnection } from '../queue/bulkActionQueue.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check (API, MongoDB, Redis)
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Dependency unavailable
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const mongoOk = mongoose.connection.readyState === 1;
    const redis = getRedisConnection();
    const pong = await redis.ping();
    const redisOk = pong === 'PONG';

    if (!mongoOk || !redisOk) {
      return sendFail(res, 'One or more dependencies unhealthy', 503, {
        mongo: mongoOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
      });
    }

    return sendOk(res, {
      mongo: 'up',
      redis: 'up',
      uptime: process.uptime(),
    }, 'Healthy');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Health check failed';
    return sendFail(res, message, 503);
  }
});

export default router;
