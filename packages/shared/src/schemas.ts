import { z } from 'zod';
import { ACTION_TYPES, ENTITY_TYPES } from './constants.js';
import { getEntityDef } from './entities/registry.js';

export const createBulkActionSchema = z
  .object({
    accountId: z.string().min(1),
    entityType: z.enum(ENTITY_TYPES).default('contact'),
    actionType: z.enum(ACTION_TYPES).default('bulk_update'),
    filters: z.record(z.unknown()).optional(),
    entityIds: z.array(z.string()).optional(),
    /** Any updatable fields for the chosen entity (name, email, status, …) */
    updates: z.record(z.union([z.string(), z.number(), z.boolean()])).refine(
      (obj) => Object.keys(obj).length > 0,
      { message: 'At least one field must be provided in updates' }
    ),
    scheduledAt: z.string().datetime().optional().nullable(),
  })
  .refine((data) => Boolean(data.filters) || Boolean(data.entityIds?.length), {
    message: 'Provide either filters or entityIds',
  })
  .superRefine((data, ctx) => {
    try {
      const def = getEntityDef(data.entityType);
      const allowed = new Set(
        def.fields.filter((f) => f.updatable).map((f) => f.key)
      );
      for (const key of Object.keys(data.updates)) {
        if (!allowed.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field "${key}" is not updatable on ${data.entityType}`,
            path: ['updates', key],
          });
        }
      }
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : 'Invalid entity',
        path: ['entityType'],
      });
    }
  });

export type CreateBulkActionInput = z.infer<typeof createBulkActionSchema>;
