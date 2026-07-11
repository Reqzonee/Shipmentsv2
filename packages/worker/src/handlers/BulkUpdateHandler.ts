import { Contact, type ContactDocument } from '@shipments/shared';
import type { BatchResult, BulkActionHandler, EntityOutcome } from './types.js';

/**
 * Bulk update handler for Contact entity.
 * Deduplicates by email within the job (first wins, rest skipped).
 */
export class BulkUpdateHandler implements BulkActionHandler {
  readonly key = 'contact:bulk_update';

  async processBatch(
    entities: ContactDocument[],
    updates: Record<string, unknown>,
    seenEmails: Set<string>
  ): Promise<BatchResult> {
    const outcomes: EntityOutcome[] = [];
    const toUpdate: { id: string; previous: Record<string, unknown> }[] = [];

    for (const entity of entities) {
      const id = String(entity._id);
      const email = String(entity.email).toLowerCase();

      if (seenEmails.has(email)) {
        outcomes.push({
          entityId: id,
          status: 'skipped',
          message: `Duplicate email: ${email}`,
          error: null,
        });
        continue;
      }
      seenEmails.add(email);

      const previous: Record<string, unknown> = {};
      for (const key of Object.keys(updates)) {
        previous[key] = (entity as unknown as Record<string, unknown>)[key];
      }
      toUpdate.push({ id, previous });
    }

    if (toUpdate.length === 0) {
      return summarize(outcomes);
    }

    try {
      const ops = toUpdate.map(({ id }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { ...updates, updatedAt: new Date() } },
        },
      }));

      await Contact.bulkWrite(ops, { ordered: false });

      for (const item of toUpdate) {
        outcomes.push({
          entityId: item.id,
          status: 'success',
          message: `Updated fields: ${Object.keys(updates).join(', ')}`,
          error: null,
          previousValues: item.previous,
          newValues: updates,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk write failed';
      for (const item of toUpdate) {
        outcomes.push({
          entityId: item.id,
          status: 'failed',
          message: null,
          error: message,
          previousValues: item.previous,
        });
      }
    }

    return summarize(outcomes);
  }
}

function summarize(outcomes: EntityOutcome[]): BatchResult {
  return {
    outcomes,
    successCount: outcomes.filter((o) => o.status === 'success').length,
    failureCount: outcomes.filter((o) => o.status === 'failed').length,
    skippedCount: outcomes.filter((o) => o.status === 'skipped').length,
  };
}
