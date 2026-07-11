import type { Request, Response } from 'express';
import { getEntityDef, listEntityDefs, type EntityType } from '@shipments/shared';
import { sendOk, sendFail } from '../middleware/errorHandler.js';

/**
 * @swagger
 * /entities:
 *   get:
 *     tags: [Entities]
 *     summary: List supported CRM entity types and updatable fields
 */
export async function listEntities(_req: Request, res: Response) {
  const data = listEntityDefs().map((d) => ({
    type: d.type,
    label: d.label,
    collectionLabel: d.collectionLabel,
    dedupeField: d.dedupeField,
    defaultStatus: d.defaultStatus,
    fields: d.fields,
  }));
  return sendOk(res, data, 'Supported CRM entities');
}

/**
 * @swagger
 * /entities/{entityType}:
 *   get:
 *     tags: [Entities]
 *     summary: List records for an entity (paginated + filters)
 */
export async function listEntityRecords(req: Request, res: Response) {
  try {
    const entityType = String(req.params.entityType) as EntityType;
    const def = getEntityDef(entityType);
    const accountId = String(req.query.accountId ?? 'acc_demo');
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const filter: Record<string, unknown> = { accountId };

    if (req.query.status) filter.status = String(req.query.status);
    const q = String(req.query.q ?? '').trim();
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      def.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      def.model.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return sendOk(res, {
      entityType,
      data,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list records';
    return sendFail(res, message, 400);
  }
}

/**
 * @swagger
 * /entities/{entityType}/seed:
 *   post:
 *     tags: [Entities]
 *     summary: Seed sample records for load testing
 */
export async function seedEntity(req: Request, res: Response) {
  try {
    const entityType = String(req.params.entityType) as EntityType;
    const def = getEntityDef(entityType);
    const accountId = String(req.body?.accountId ?? 'acc_demo');
    const count = Math.min(50_000, Math.max(1, Number(req.body?.count ?? 2000)));
    const stamp = Date.now();

    const docs = Array.from({ length: count }, (_, i) =>
      buildSeedDoc(entityType, accountId, stamp, i)
    );

    const result = await def.model.insertMany(docs, { ordered: false }).catch(
      (err: { insertedDocs?: unknown[] }) => {
        if (err.insertedDocs) return err.insertedDocs;
        throw err;
      }
    );

    const inserted = Array.isArray(result) ? result.length : 0;
    return sendOk(
      res,
      { entityType, accountId, requested: count, inserted },
      `Seeded ${inserted} ${def.collectionLabel.toLowerCase()}`,
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seed failed';
    return sendFail(res, message, 500);
  }
}

/**
 * @swagger
 * /entities/seed-all:
 *   post:
 *     tags: [Entities]
 *     summary: Seed all CRM entity types for demos / load tests
 */
export async function seedAllEntities(req: Request, res: Response) {
  try {
    const accountId = String(req.body?.accountId ?? 'acc_demo');
    const count = Math.min(10_000, Math.max(1, Number(req.body?.count ?? 2000)));
    const stamp = Date.now();
    const results: Record<string, number> = {};

    for (const def of listEntityDefs()) {
      const docs = Array.from({ length: count }, (_, i) =>
        buildSeedDoc(def.type, accountId, stamp, i)
      );
      const result = await def.model.insertMany(docs, { ordered: false }).catch(
        (err: { insertedDocs?: unknown[] }) => {
          if (err.insertedDocs) return err.insertedDocs;
          throw err;
        }
      );
      results[def.type] = Array.isArray(result) ? result.length : 0;
    }

    return sendOk(
      res,
      { accountId, requestedPerEntity: count, results },
      'Seeded all CRM entities',
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seed-all failed';
    return sendFail(res, message, 500);
  }
}

function buildSeedDoc(
  entityType: string,
  accountId: string,
  stamp: number,
  i: number
): Record<string, unknown> {
  const email = `user.${stamp}.${i}@example.com`;
  switch (entityType) {
    case 'contact': {
      const statuses = ['active', 'inactive', 'lead'] as const;
      return {
        accountId,
        name: `Contact ${i}`,
        email,
        age: 18 + (i % 50),
        status: statuses[i % statuses.length],
      };
    }
    case 'company': {
      const statuses = ['active', 'inactive', 'prospect'] as const;
      const industries = ['Tech', 'Finance', 'Healthcare', 'Retail', 'Logistics'];
      return {
        accountId,
        name: `Company ${i}`,
        email: `company.${stamp}.${i}@example.com`,
        industry: industries[i % industries.length],
        status: statuses[i % statuses.length],
      };
    }
    case 'lead': {
      const statuses = ['new', 'contacted', 'qualified', 'lost'] as const;
      const sources = ['web', 'referral', 'ads', 'event'];
      return {
        accountId,
        name: `Lead ${i}`,
        email,
        source: sources[i % sources.length],
        status: statuses[i % statuses.length],
      };
    }
    case 'opportunity': {
      const stages = [
        'prospecting',
        'qualification',
        'proposal',
        'negotiation',
        'closed_won',
        'closed_lost',
      ] as const;
      return {
        accountId,
        name: `Deal ${i}`,
        email,
        amount: 1000 + (i % 50) * 250,
        status: stages[i % stages.length],
      };
    }
    case 'task': {
      const statuses = ['todo', 'in_progress', 'done', 'cancelled'] as const;
      const priorities = ['low', 'medium', 'high'] as const;
      return {
        accountId,
        name: `Task ${i}`,
        email,
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
      };
    }
    default:
      return { accountId, name: `Row ${i}`, email, status: 'active' };
  }
}
