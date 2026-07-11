import type { Model } from 'mongoose';
import type { BatchResult, BulkActionHandler, EntityOutcome } from './types.js';

type AnyDoc = { _id: unknown } & Record<string, unknown>;

/**
 * Entity-agnostic bulk update. Register once per entityType via registry.
 * Dedupes by email within the job when present; validates field values lightly.
 */
export class GenericBulkUpdateHandler implements BulkActionHandler {
  readonly key: string;

  constructor(
    private readonly entityType: string,
    private readonly model: Model<any>,
    private readonly dedupeField: string,
    private readonly updatableFields: Set<string>
  ) {
    this.key = `${entityType}:bulk_update`;
  }

  async processBatch(
    entities: AnyDoc[],
    updates: Record<string, unknown>,
    seenEmails: Set<string>
  ): Promise<BatchResult> {
    const outcomes: EntityOutcome[] = [];
    const toUpdate: { id: string; previous: Record<string, unknown>; sanitized: Record<string, unknown> }[] = [];

    // Drop unknown fields
    const sanitizedUpdates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (this.updatableFields.has(k)) sanitizedUpdates[k] = v;
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      for (const entity of entities) {
        outcomes.push({
          entityId: String(entity._id),
          status: 'failed',
          message: null,
          error: 'No valid updatable fields in payload',
        });
      }
      return summarize(outcomes);
    }

    for (const entity of entities) {
      const id = String(entity._id);

      // Per-entity validation
      if ('email' in sanitizedUpdates) {
        const email = String(sanitizedUpdates.email);
        if (!email.includes('@')) {
          outcomes.push({
            entityId: id,
            status: 'failed',
            message: null,
            error: `Invalid email format: "${email}"`,
          });
          continue;
        }
      }
      if ('age' in sanitizedUpdates) {
        const age = Number(sanitizedUpdates.age);
        if (Number.isNaN(age) || age < 0 || age > 150) {
          outcomes.push({
            entityId: id,
            status: 'failed',
            message: null,
            error: `Invalid age: ${String(sanitizedUpdates.age)}`,
          });
          continue;
        }
      }
      if ('amount' in sanitizedUpdates) {
        const amount = Number(sanitizedUpdates.amount);
        if (Number.isNaN(amount) || amount < 0) {
          outcomes.push({
            entityId: id,
            status: 'failed',
            message: null,
            error: `Invalid amount: ${String(sanitizedUpdates.amount)}`,
          });
          continue;
        }
      }

      const dedupeVal = entity[this.dedupeField];
      if (typeof dedupeVal === 'string' && dedupeVal) {
        const key = dedupeVal.toLowerCase();
        if (seenEmails.has(key)) {
          outcomes.push({
            entityId: id,
            status: 'skipped',
            message: `Duplicate ${this.dedupeField}: ${key}`,
            error: null,
          });
          continue;
        }
        seenEmails.add(key);
      }

      const previous: Record<string, unknown> = {};
      for (const key of Object.keys(sanitizedUpdates)) {
        previous[key] = entity[key];
      }
      toUpdate.push({ id, previous, sanitized: sanitizedUpdates });
    }

    if (toUpdate.length === 0) {
      return summarize(outcomes);
    }

    try {
      const ops = toUpdate.map(({ id, sanitized }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { ...sanitized, updatedAt: new Date() } },
        },
      }));

      await this.model.bulkWrite(ops, { ordered: false });

      for (const item of toUpdate) {
        outcomes.push({
          entityId: item.id,
          status: 'success',
          message: `Updated fields: ${Object.keys(item.sanitized).join(', ')}`,
          error: null,
          previousValues: item.previous,
          newValues: item.sanitized,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk write failed';
      for (const item of toUpdate) {
        outcomes.push({
          entityId: item.id,
          status: 'failed',
          message: null,
          error: `Bulk write error: ${message}`,
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
