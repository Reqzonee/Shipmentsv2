export const BULK_ACTION_STATUSES = [
  'scheduled',
  'queued',
  'running',
  'completed',
  'failed',
  'partial',
] as const;

export type BulkActionStatus = (typeof BULK_ACTION_STATUSES)[number];

export const LOG_STATUSES = ['success', 'failed', 'skipped'] as const;
export type LogStatus = (typeof LOG_STATUSES)[number];

export const CONTACT_STATUSES = ['active', 'inactive', 'lead'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const COMPANY_STATUSES = ['active', 'inactive', 'prospect'] as const;
export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost'] as const;
export const OPPORTUNITY_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
] as const;
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'] as const;

/** Assignment entities — architecture stays pluggable via registry */
export const ENTITY_TYPES = [
  'contact',
  'company',
  'lead',
  'opportunity',
  'task',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ACTION_TYPES = ['bulk_update'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const QUEUE_NAME = 'bulk-actions';
export const DEFAULT_BATCH_SIZE = 500;
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 10_000;

/** Elevate-style API envelope */
export interface ApiResponse<T = unknown> {
  isOk: boolean;
  message: string;
  status: number;
  data?: T;
}
