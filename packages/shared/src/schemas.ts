import { z } from 'zod';
import { ACTION_TYPES, CONTACT_STATUSES, ENTITY_TYPES } from './constants.js';

export const createBulkActionSchema = z
  .object({
    accountId: z.string().min(1),
    entityType: z.enum(ENTITY_TYPES).default('contact'),
    actionType: z.enum(ACTION_TYPES).default('bulk_update'),
    filters: z.record(z.unknown()).optional(),
    entityIds: z.array(z.string()).optional(),
    updates: z
      .object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        age: z.number().int().min(0).max(150).optional(),
        status: z.enum(CONTACT_STATUSES).optional(),
      })
      .refine((obj) => Object.keys(obj).length > 0, {
        message: 'At least one field must be provided in updates',
      }),
    scheduledAt: z.string().datetime().optional().nullable(),
  })
  .refine((data) => Boolean(data.filters) || Boolean(data.entityIds?.length), {
    message: 'Provide either filters or entityIds',
  });

export type CreateBulkActionInput = z.infer<typeof createBulkActionSchema>;
