import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type BulkAction } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'queued', label: 'Queued' },
  { key: 'running', label: 'Ongoing' },
  { key: 'scheduled', label: 'Future / Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed' },
  { key: 'partial', label: 'Partial' },
] as const;

export function DashboardPage() {
  const [actions, setActions] = useState<BulkAction[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [accountId, setAccountId] = useState('acc_demo');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setError(null);
      const res = await api.listActions({
        accountId: accountId || undefined,
        status: status || undefined,
      });
      setActions(res.data?.data ?? []);
      setTotal(res.data?.pagination.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, accountId]);

  const running = actions.filter((a) => a.status === 'running' || a.status === 'queued').length;
  const scheduled = actions.filter((a) => a.status === 'scheduled').length;
  const completed = actions.filter((a) => a.status === 'completed').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Bulk actions</h1>
          <p className="mt-1 text-slate-600">
            Queued, ongoing, completed, and future (scheduled) jobs — filtered by account.
          </p>
        </div>
        <Link
          to="/create"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
        >
          New bulk update
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Listed" value={String(total)} />
        <StatCard label="In flight" value={String(running)} />
        <StatCard label="Scheduled (future)" value={String(scheduled)} />
        <StatCard label="Completed (page)" value={String(completed)} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-[180px]"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="accountId"
        />
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key || 'all'}
              type="button"
              onClick={() => setStatus(tab.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                status === tab.key
                  ? 'bg-ink-900 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-panel">
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-500">Loading…</p>
        ) : actions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">No actions for this filter.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {actions.map((action) => {
              const id = action.id ?? action._id ?? '';
              const isFuture = action.status === 'scheduled';
              return (
                <li key={id} className="px-5 py-4 transition hover:bg-slate-50/80">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        to={`/actions/${id}`}
                        className="font-semibold text-ink-900 hover:text-accent-dark"
                      >
                        {action.actionType} · {action.entityType}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {action.accountId}
                        {isFuture && action.scheduledAt
                          ? ` · future run ${new Date(action.scheduledAt).toLocaleString()}`
                          : ''}
                        {action.createdAt
                          ? ` · created ${new Date(action.createdAt).toLocaleString()}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isFuture && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                          Future update
                        </span>
                      )}
                      <StatusBadge status={action.status} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <ProgressBar
                        value={action.progressPercent ?? 0}
                        animated={action.status === 'running' || action.status === 'queued'}
                      />
                    </div>
                    <span className="w-28 text-right text-xs tabular-nums text-slate-500">
                      {action.processedCount}/{action.totalCount}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink-950">{value}</p>
    </div>
  );
}
