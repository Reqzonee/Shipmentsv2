const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

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

export type Contact = {
  _id: string;
  name: string;
  email: string;
  age: number;
  status: string;
};

export const api = {
  listActions: (accountId = 'acc_demo') =>
    request<{ data: BulkAction[]; pagination: { total: number } }>(
      `/bulk-actions?accountId=${encodeURIComponent(accountId)}&limit=50`
    ),
  getAction: (id: string) => request<BulkAction>(`/bulk-actions/${id}`),
  getStats: (id: string) => request<BulkActionStats>(`/bulk-actions/${id}/stats`),
  getLogs: (id: string, status?: string) => {
    const q = status ? `?status=${status}&limit=100` : '?limit=100';
    return request<{ data: BulkActionLog[]; pagination: { total: number } }>(
      `/bulk-actions/${id}/logs${q}`
    );
  },
  createAction: (body: Record<string, unknown>) =>
    request<{ id: string; status: string; totalCount: number }>('/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listContacts: (params: {
    accountId?: string;
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
    minAge?: string;
    maxAge?: string;
  } = {}) => {
    const sp = new URLSearchParams();
    sp.set('accountId', params.accountId ?? 'acc_demo');
    sp.set('page', String(params.page ?? 1));
    sp.set('limit', String(params.limit ?? 20));
    if (params.status) sp.set('status', params.status);
    if (params.q) sp.set('q', params.q);
    if (params.minAge) sp.set('minAge', params.minAge);
    if (params.maxAge) sp.set('maxAge', params.maxAge);
    return request<{
      data: Contact[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/contacts?${sp.toString()}`);
  },
  seedContacts: (count = 2000, accountId = 'acc_demo') =>
    request<{ inserted: number }>('/contacts/seed', {
      method: 'POST',
      body: JSON.stringify({ accountId, count }),
    }),
};

export { API_BASE };
