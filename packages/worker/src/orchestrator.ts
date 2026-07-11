import {
  BulkAction,
  BulkActionLog,
  Contact,
  type BulkActionDocument,
} from '@shipments/shared';
import { Types } from 'mongoose';
import { getHandler } from './handlers/registry.js';
import { env } from './config/env.js';

export async function processBulkAction(actionId: string): Promise<void> {
  const action = await BulkAction.findById(actionId);
  if (!action) {
    throw new Error(`Bulk action not found: ${actionId}`);
  }

  if (['completed', 'failed', 'partial'].includes(action.status)) {
    console.log(`Action ${actionId} already finished (${action.status}) — skip`);
    return;
  }

  const handler = getHandler(action.entityType, action.actionType);
  if (!handler) {
    action.status = 'failed';
    action.error = `No handler for ${action.entityType}:${action.actionType}`;
    action.completedAt = new Date();
    await action.save();
    throw new Error(action.error);
  }

  action.status = 'running';
  action.startedAt = action.startedAt ?? new Date();
  action.error = null;
  await action.save();

  const seenEmails = new Set<string>();
  // Cursor by _id — NEVER use skip while updating filter fields (e.g. status),
  // or rows "fall out" of the query and get skipped forever.
  let lastId: Types.ObjectId | null = null;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const query = buildQuery(action, lastId);
      const batch = await Contact.find(query)
        .sort({ _id: 1 })
        .limit(env.batchSize)
        .lean();

      if (batch.length === 0) break;

      const updates = (action.payload?.updates ?? {}) as Record<string, unknown>;
      const result = await handler.processBatch(
        batch as never,
        updates,
        seenEmails
      );

      if (result.outcomes.length > 0) {
        await BulkActionLog.insertMany(
          result.outcomes.map((o) => ({
            actionId: action._id,
            accountId: action.accountId,
            entityId: o.entityId,
            entityType: action.entityType,
            status: o.status,
            message: o.message,
            error: o.error,
            metadata: {
              previousValues: o.previousValues,
              newValues: o.newValues,
            },
            processedAt: new Date(),
          })),
          { ordered: false }
        );
      }

      action.processedCount += result.outcomes.length;
      action.successCount += result.successCount;
      action.failureCount += result.failureCount;
      action.skippedCount += result.skippedCount;
      await action.save();

      lastId = batch[batch.length - 1]._id as Types.ObjectId;
      console.log(
        `Action ${actionId}: processed ${action.processedCount}/${action.totalCount}`
      );
    }

    // Align total with what we actually walked (in case count drifted)
    if (action.processedCount > 0 && action.processedCount !== action.totalCount) {
      action.totalCount = action.processedCount;
    }

    action.completedAt = new Date();
    if (action.failureCount > 0 && action.successCount > 0) {
      action.status = 'partial';
    } else if (action.failureCount > 0 && action.successCount === 0) {
      action.status = 'failed';
    } else {
      action.status = 'completed';
    }
    await action.save();
    console.log(`Action ${actionId} finished: ${action.status}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    action.status = 'failed';
    action.error = message;
    action.completedAt = new Date();
    await action.save();
    throw err;
  }
}

function buildQuery(
  action: BulkActionDocument,
  afterId: Types.ObjectId | null
): Record<string, unknown> {
  const query: Record<string, unknown> = { accountId: action.accountId };
  const payload = action.payload ?? {};

  if (payload.entityIds && payload.entityIds.length > 0) {
    const ids = payload.entityIds.map((id) => new Types.ObjectId(String(id)));
    query._id = afterId ? { $in: ids, $gt: afterId } : { $in: ids };
  } else {
    if (payload.filters && typeof payload.filters === 'object') {
      Object.assign(query, payload.filters);
    }
    if (afterId) {
      query._id = { $gt: afterId };
    }
  }

  return query;
}
