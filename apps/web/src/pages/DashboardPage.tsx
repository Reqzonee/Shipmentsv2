import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type BulkAction } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';

export function DashboardPage() {
  const [actions, setActions] = useState<BulkAction[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setError(null);
      const res = await api.listActions();
      setActions(res.data?.data ?? []);
      setTotal(res.data?.pagination.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const running = actions.filter((a) => a.status === 'running' || a.status === 'queued').length;
  const completed = actions.filter((a) => a.status === 'completed').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Bulk actions</h1>
          <p className="mt-1 text-slate-600">
            Monitor queued, running, and completed CRM bulk jobs.
          </p>
        </div>
        <Link
          to="/create"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
        >
          New bulk update
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total actions" value={String(total)} />
        <StatCard label="In flight" value={String(running)} />
        <StatCard label="Completed" value={String(completed)} />
      </section>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-panel">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent jobs
          </h2>
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-500">Loading…</p>
        ) : actions.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">
            No bulk actions yet. Seed contacts, then create one.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {actions.map((action) => {
              const id = action.id ?? action._id ?? '';
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
                        {id.slice(0, 10)}… · {action.accountId} ·{' '}
                        {action.createdAt
                          ? new Date(action.createdAt).toLocaleString()
                          : '—'}
                      </p>
                    </div>
                    <StatusBadge status={action.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <ProgressBar value={action.progressPercent ?? 0} />
                    </div>
                    <span className="w-24 text-right text-xs tabular-nums text-slate-500">
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
