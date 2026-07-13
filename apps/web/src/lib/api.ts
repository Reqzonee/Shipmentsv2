const API_BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:3000/api/v1');

export type ApiResponse<T> = {
  isOk: boolean;
  message: string;
  status: number;
  data?: T;
};

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.isOk) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json;
}

export type BulkAction = {
  id?: string;
  _id?: string;
  accountId: string;
  entityType: string;
  actionType: string;
  status: string;
  totalCount: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  progressPercent: number;
  scheduledAt?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  payload?: {
    filters?: Record<string, unknown>;
    updates?: Record<string, unknown>;
  };
  error?: string | null;
};

export type BulkActionStats = {
  actionId: string;
  status: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  processedCount: number;
  progressPercent: number;
  durationMs: number;
  throughputPerMinute: number;
};

export type BulkActionLog = {
  entityId: string;
  status: 'success' | 'failed' | 'skipped';
  message: string | null;
  error: string | null;
  processedAt: string;
};

export type EntityField = {
  key: string;
  label: string;
  type: string;
  enumValues?: string[];
  updatable: boolean;
  filterable: boolean;
};

export type EntityMeta = {
  type: string;
  label: string;
  collectionLabel: string;
  dedupeField: string;
  defaultStatus: string;
  fields: EntityField[];
};

export type EntityRecord = {
  _id: string;
  name?: string;
  email?: string;
  status?: string;
  [key: string]: unknown;
};

export const api = {
  listActions: (params: { accountId?: string; status?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.accountId) sp.set('accountId', params.accountId);
    if (params.status) sp.set('status', params.status);
    sp.set('limit', '50');
    return request<{ data: BulkAction[]; pagination: { total: number } }>(
      `/bulk-actions?${sp.toString()}`
    );
  },
  getAction: (id: string) => request<BulkAction>(`/bulk-actions/${id}`),
  getStats: (id: string) => request<BulkActionStats>(`/bulk-actions/${id}/stats`),
  getLogs: (id: string, status?: string, page = 1) => {
    const sp = new URLSearchParams({ limit: '100', page: String(page) });
    if (status) sp.set('status', status);
    return request<{ data: BulkActionLog[]; pagination: { total: number } }>(
      `/bulk-actions/${id}/logs?${sp.toString()}`
    );
  },
  createAction: (body: Record<string, unknown>) =>
    request<{ id: string; status: string; totalCount: number }>('/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listEntities: () => request<EntityMeta[]>('/entities'),
  listEntityRecords: (entityType: string, params: Record<string, string | number> = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== undefined) sp.set(k, String(v));
    });
    return request<{
      entityType: string;
      data: EntityRecord[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/entities/${entityType}?${sp.toString()}`);
  },
  seedEntity: (entityType: string, count = 2000, accountId = 'acc_demo') =>
    request<{ inserted: number }>(`/entities/${entityType}/seed`, {
      method: 'POST',
      body: JSON.stringify({ accountId, count }),
    }),
  seedAll: (count = 2000, accountId = 'acc_demo') =>
    request<{ results: Record<string, number> }>('/entities/seed-all', {
      method: 'POST',
      body: JSON.stringify({ accountId, count }),
    }),
  runQueueCascade: (body: {
    accountId?: string;
    jobs?: number;
    chunkSize?: number;
    staggerMs?: number;
  } = {}) =>
    request<{
      accountId: string;
      jobs: number;
      created: Array<{ id: string; label: string; totalCount: number; status: string }>;
      tip: string;
      approxSecondsPerJob?: number;
    }>('/bulk-actions/demo/queue-cascade', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  // legacy contact helpers
  listContacts: (params: Record<string, string | number> = {}) =>
    api.listEntityRecords('contact', { accountId: 'acc_demo', page: 1, limit: 20, ...params }),
  seedContacts: (count = 2000, accountId = 'acc_demo') =>
    api.seedEntity('contact', count, accountId),
};

export { API_BASE };
