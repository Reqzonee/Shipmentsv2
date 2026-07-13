import type { Request, Response } from 'express';
import { Contact, BulkAction } from '@shipments/shared';
import { sendOk, sendFail } from '../middleware/errorHandler.js';
import {
  getBulkActionQueue,
  getRedisConnection,
  type BulkActionJobData,
} from '../queue/bulkActionQueue.js';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Live demo: create several REAL bulk actions (chunked by entityIds),
 * staggered so the dashboard shows them stacking in Queued, then
 * the worker drains them one-by-one (or with low concurrency).
 *
 * POST /bulk-actions/demo/queue-cascade
 * body: { accountId?, jobs?, chunkSize?, staggerMs? }
 */
export async function runQueueCascadeDemo(req: Request, res: Response) {
  try {
    const accountId = String(req.body?.accountId ?? 'acc_demo').trim() || 'acc_demo';
    const jobs = Math.min(8, Math.max(2, Number(req.body?.jobs ?? 5)));
    // Bigger chunks + paced batches = visible progress bars in the UI
    const chunkSize = Math.min(800, Math.max(80, Number(req.body?.chunkSize ?? 200)));
    const staggerMs = Math.min(4000, Math.max(0, Number(req.body?.staggerMs ?? 1200)));
    const demoBatchSize = Math.min(80, Math.max(10, Number(req.body?.demoBatchSize ?? 20)));
    const demoPaceMs = Math.min(2000, Math.max(100, Number(req.body?.demoPaceMs ?? 500)));

    // Clear this account's rate buckets so the demo doesn't 429 mid-run
    try {
      const redis = getRedisConnection();
      const keys = await redis.keys(`rate:${accountId}:*`);
      if (keys.length) await redis.del(...keys);
    } catch {
      /* ignore */
    }

    const needed = jobs * chunkSize;
    let contacts = await Contact.find({ accountId })
      .sort({ _id: 1 })
      .limit(needed)
      .select('_id')
      .lean();

    if (contacts.length < needed) {
      // Auto-seed enough contacts for the cascade
      const stamp = Date.now();
      const toInsert = Array.from({ length: needed - contacts.length }, (_, i) => {
        const n = contacts.length + i;
        return {
          accountId,
          name: `Cascade Demo ${n}`,
          email: `cascade.demo.${stamp}.${n}@example.com`,
          age: 20 + (n % 40),
          status: (['active', 'inactive', 'lead'] as const)[n % 3],
        };
      });
      await Contact.insertMany(toInsert, { ordered: false });
      contacts = await Contact.find({ accountId })
        .sort({ _id: 1 })
        .limit(needed)
        .select('_id')
        .lean();
    }

    if (contacts.length < chunkSize) {
      return sendFail(
        res,
        `Not enough contacts for account "${accountId}". Seed CRM Entities first.`,
        400
      );
    }

    const queue = getBulkActionQueue();
    const created: Array<{
      id: string;
      status: string;
      totalCount: number;
      jobId: string | null;
      label: string;
    }> = [];

    const stamp = Date.now();
    for (let i = 0; i < jobs; i++) {
      const slice = contacts.slice(i * chunkSize, (i + 1) * chunkSize);
      if (slice.length === 0) break;

      const entityIds = slice.map((c) => String(c._id));
      const label = `Cascade #${i + 1}/${jobs}`;
      const action = await BulkAction.create({
        accountId,
        entityType: 'contact',
        actionType: 'bulk_update',
        status: 'queued',
        payload: {
          entityIds,
          filters: {},
          updates: {
            // Distinct name per job so you can see each wave land in CRM Entities
            name: `${label} · ${stamp}`,
          },
          cascadeDemo: true,
          demoBatchSize,
          demoPaceMs,
        },
        totalCount: entityIds.length,
      });

      const job = await queue.add(
        'process-bulk-action',
        { actionId: String(action._id), accountId } satisfies BulkActionJobData
      );
      action.jobId = job.id ?? null;
      await action.save();

      created.push({
        id: String(action._id),
        status: action.status,
        totalCount: entityIds.length,
        jobId: action.jobId,
        label,
      });

      if (staggerMs > 0 && i < jobs - 1) {
        await sleep(staggerMs);
      }
    }

    return sendOk(
      res,
      {
        accountId,
        jobs: created.length,
        chunkSize,
        staggerMs,
        demoBatchSize,
        demoPaceMs,
        created,
        tip: 'Stay on Dashboard → All with account acc_demo. Progress updates every ~0.5s.',
        approxSecondsPerJob: Math.ceil((chunkSize / demoBatchSize) * (demoPaceMs / 1000)),
      },
      `Queued ${created.length} cascade jobs — watch progress bars move live`,
      202
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cascade demo failed';
    return sendFail(res, message, 500);
  }
}
