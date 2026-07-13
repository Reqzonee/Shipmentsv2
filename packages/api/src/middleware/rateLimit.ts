import type { Request, Response, NextFunction } from 'express';
import { getRedisConnection } from '../queue/bulkActionQueue.js';
import { env } from '../config/env.js';
import { sendFail } from './errorHandler.js';

/**
 * Per-account sliding window rate limit (events ≈ entities in the bulk action).
 * Key: rate:{accountId}:{minuteBucket}
 */
export async function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const accountId = String(req.body?.accountId ?? '');
    if (!accountId) {
      return sendFail(res, 'accountId is required for rate limiting', 400);
    }

    // Estimate events for this request (best-effort before full count)
    const estimated =
      Array.isArray(req.body?.entityIds) && req.body.entityIds.length > 0
        ? req.body.entityIds.length
        : Number(req.body?.estimatedCount ?? 1);

    const redis = getRedisConnection();
    const bucket = Math.floor(Date.now() / 60_000);
    const key = `rate:${accountId}:${bucket}`;

    const current = await redis.incrby(key, Math.max(1, estimated));
    if (current === Math.max(1, estimated)) {
      await redis.expire(key, 120);
    }

    if (current > env.rateLimitPerMinute) {
      // roll back this increment so rejected requests don't permanently burn quota
      await redis.decrby(key, Math.max(1, estimated));
      const ttl = await redis.ttl(key);
      res.setHeader('Retry-After', String(Math.max(ttl, 1)));
      return sendFail(
        res,
        'Rate limit exceeded',
        429,
        {
          limit: env.rateLimitPerMinute,
          window: '1 minute',
          retryAfter: Math.max(ttl, 1),
          current,
        }
      );
    }

    // Stash for controller to adjust after real totalCount is known
    res.locals.rateKey = key;
    res.locals.rateEstimated = Math.max(1, estimated);
    next();
  } catch (err) {
    // Fail open on Redis errors so API stays usable; log for ops
    console.error('Rate limit check failed:', err);
    next();
  }
}

/** Adjust rate counter once real entity count is known */
export async function adjustRateLimit(
  rateKey: string | undefined,
  estimated: number,
  actual: number
) {
  if (!rateKey || actual === estimated) return;
  const redis = getRedisConnection();
  const delta = actual - estimated;
  if (delta !== 0) {
    await redis.incrby(rateKey, delta);
  }
}

/** Refund usage when a create is rejected after the counter was charged */
export async function refundRateLimit(
  rateKey: string | undefined,
  amount: number
) {
  if (!rateKey || amount <= 0) return;
  const redis = getRedisConnection();
  await redis.decrby(rateKey, amount);
}
