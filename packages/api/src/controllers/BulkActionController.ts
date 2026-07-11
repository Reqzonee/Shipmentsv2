import type { Request, Response } from 'express';
import {
  BulkAction,
  BulkActionLog,
  Contact,
  createBulkActionSchema,
} from '@shipments/shared';
import { sendOk, sendFail } from '../middleware/errorHandler.js';
import {
  getBulkActionQueue,
  type BulkActionJobData,
} from '../queue/bulkActionQueue.js';
import { adjustRateLimit } from '../middleware/rateLimit.js';
import { env } from '../config/env.js';

function progressPercent(doc: {
  totalCount: number;
  processedCount: number;
}): number {
  if (!doc.totalCount) return 0;
  return Math.min(100, Math.round((doc.processedCount / doc.totalCount) * 100));
}

/**
 * @swagger
 * /bulk-actions:
 *   get:
 *     tags: [Bulk Actions]
 *     summary: List bulk actions
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of bulk actions
 */
export async function listBulkActions(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const filter: Record<string, unknown> = {};

    if (req.query.accountId) filter.accountId = String(req.query.accountId);
    if (req.query.status) filter.status = String(req.query.status);

    const [items, total] = await Promise.all([
      BulkAction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BulkAction.countDocuments(filter),
    ]);

    return sendOk(res, {
      data: items.map((item) => ({
        ...item,
        id: String(item._id),
        progressPercent: progressPercent(item),
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list actions';
    return sendFail(res, message, 500);
  }
}

/**
 * @swagger
 * /bulk-actions:
 *   post:
 *     tags: [Bulk Actions]
 *     summary: Create a bulk action (queued or scheduled)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, updates]
 *             properties:
 *               accountId: { type: string, example: acc_demo }
 *               entityType: { type: string, example: contact }
 *               actionType: { type: string, example: bulk_update }
 *               filters:
 *                 type: object
 *                 example: { status: inactive }
 *               entityIds:
 *                 type: array
 *                 items: { type: string }
 *               updates:
 *                 type: object
 *                 example: { status: active }
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       202:
 *         description: Bulk action accepted
 *       400:
 *         description: Validation error
 */
export async function createBulkAction(req: Request, res: Response) {
  try {
    const parsed = createBulkActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendFail(res, 'Validation failed', 400, parsed.error.flatten());
    }

    const input = parsed.data;
    const accountId = input.accountId;

    // Resolve target contacts count
    const query: Record<string, unknown> = { accountId };
    if (input.entityIds?.length) {
      query._id = { $in: input.entityIds };
    } else if (input.filters) {
      Object.assign(query, input.filters);
    }

    const totalCount = await Contact.countDocuments(query);
    if (totalCount === 0) {
      return sendFail(res, 'No contacts matched the given filters/entityIds', 400);
    }

    await adjustRateLimit(
      res.locals.rateKey as string | undefined,
      Number(res.locals.rateEstimated ?? 1),
      totalCount
    );

    if (totalCount > env.rateLimitPerMinute) {
      return sendFail(
        res,
        `This action targets ${totalCount} entities which exceeds the per-minute rate limit of ${env.rateLimitPerMinute}`,
        429,
        { limit: env.rateLimitPerMinute, totalCount }
      );
    }

    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    const isScheduled = scheduledAt !== null && scheduledAt.getTime() > Date.now();

    const action = await BulkAction.create({
      accountId,
      entityType: input.entityType,
      actionType: input.actionType,
      status: isScheduled ? 'scheduled' : 'queued',
      payload: {
        filters: input.filters,
        entityIds: input.entityIds,
        updates: input.updates,
      },
      totalCount,
      scheduledAt,
    });

    const delay = isScheduled ? scheduledAt!.getTime() - Date.now() : 0;
    const queue = getBulkActionQueue();
    const job = await queue.add(
      'process-bulk-action',
      { actionId: String(action._id), accountId } satisfies BulkActionJobData,
      { delay: delay > 0 ? delay : undefined }
    );

    action.jobId = job.id ?? null;
    await action.save();

    return sendOk(
      res,
      {
        id: String(action._id),
        status: action.status,
        totalCount,
        jobId: action.jobId,
        scheduledAt: action.scheduledAt,
      },
      'Bulk action queued successfully',
      202
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create action';
    return sendFail(res, message, 500);
  }
}

/**
 * @swagger
 * /bulk-actions/{actionId}:
 *   get:
 *     tags: [Bulk Actions]
 *     summary: Get bulk action status and progress
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Action details
 *       404:
 *         description: Not found
 */
export async function getBulkAction(req: Request, res: Response) {
  try {
    const action = await BulkAction.findById(req.params.actionId).lean();
    if (!action) return sendFail(res, 'Bulk action not found', 404);

    return sendOk(res, {
      ...action,
      id: String(action._id),
      progressPercent: progressPercent(action),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get action';
    return sendFail(res, message, 500);
  }
}

/**
 * @swagger
 * /bulk-actions/{actionId}/stats:
 *   get:
 *     tags: [Bulk Actions]
 *     summary: Get success / failure / skipped summary
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stats summary
 */
export async function getBulkActionStats(req: Request, res: Response) {
  try {
    const action = await BulkAction.findById(req.params.actionId).lean();
    if (!action) return sendFail(res, 'Bulk action not found', 404);

    const started = action.startedAt ? new Date(action.startedAt).getTime() : null;
    const ended = action.completedAt
      ? new Date(action.completedAt).getTime()
      : Date.now();
    const durationMs = started ? Math.max(0, ended - started) : 0;
    const throughputPerMinute =
      durationMs > 0
        ? Math.round((action.processedCount / durationMs) * 60_000)
        : 0;

    return sendOk(res, {
      actionId: String(action._id),
      status: action.status,
      totalCount: action.totalCount,
      successCount: action.successCount,
      failureCount: action.failureCount,
      skippedCount: action.skippedCount,
      processedCount: action.processedCount,
      progressPercent: progressPercent(action),
      durationMs,
      throughputPerMinute,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get stats';
    return sendFail(res, message, 500);
  }
}

/**
 * @swagger
 * /bulk-actions/{actionId}/logs:
 *   get:
 *     tags: [Bulk Actions]
 *     summary: List per-entity processing logs
 *     parameters:
 *       - in: path
 *         name: actionId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [success, failed, skipped] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated logs
 */
export async function getBulkActionLogs(req: Request, res: Response) {
  try {
    const actionId = req.params.actionId;
    const exists = await BulkAction.exists({ _id: actionId });
    if (!exists) return sendFail(res, 'Bulk action not found', 404);

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));
    const filter: Record<string, unknown> = { actionId };
    if (req.query.status) filter.status = String(req.query.status);

    const [data, total] = await Promise.all([
      BulkActionLog.find(filter)
        .sort({ processedAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BulkActionLog.countDocuments(filter),
    ]);

    return sendOk(res, {
      data,
      pagination: { page, limit, total },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get logs';
    return sendFail(res, message, 500);
  }
}
