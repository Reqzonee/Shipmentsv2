import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  api,
  type BulkAction,
  type BulkActionLog,
  type BulkActionStats,
} from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import { QueueProgressPanel } from '../components/QueueProgressPanel';

const COLORS = {
  success: '#059669',
  failed: '#e11d48',
  skipped: '#d97706',
};

export function ActionDetailPage() {
  const { actionId = '' } = useParams();
  const [action, setAction] = useState<BulkAction | null>(null);
  const [stats, setStats] = useState<BulkActionStats | null>(null);
  const [logs, setLogs] = useState<BulkActionLog[]>([]);
  const [logFilter, setLogFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function tick() {
      try {
        const [a, s] = await Promise.all([
          api.getAction(actionId),
          api.getStats(actionId),
        ]);
        if (cancelled) return;
        setAction(a.data ?? null);
        setStats(s.data ?? null);
        setError(null);

        const status = a.data?.status;
        if (status === 'queued' || status === 'running' || status === 'scheduled') {
          timer = window.setTimeout(tick, 1000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load action');
        }
      }
    }

    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [actionId]);

  useEffect(() => {
    api
      .getLogs(actionId, logFilter || undefined)
      .then((res) => setLogs(res.data?.data ?? []))
      .catch(() => setLogs([]));
  }, [actionId, logFilter, action?.processedCount]);

  const chartData = useMemo(
    () => [
      { name: 'success', value: stats?.successCount ?? 0 },
      { name: 'failed', value: stats?.failureCount ?? 0 },
      { name: 'skipped', value: stats?.skippedCount ?? 0 },
    ],
    [stats]
  );

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {error}
      </div>
    );
  }

  if (!action || !stats) {
    return <p className="text-sm text-slate-500">Loading action…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link to="/" className="text-sm font-medium text-accent-dark hover:underline">
          ← Back to dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-ink-950">Action detail</h1>
          <StatusBadge status={action.status} />
        </div>
        <p className="mt-1 font-mono text-xs text-slate-500">{actionId}</p>
      </div>

      <QueueProgressPanel
        status={action.status}
        processed={action.processedCount}
        total={action.totalCount}
        progressPercent={action.progressPercent}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Success" value={stats.successCount} tone="text-emerald-700" />
        <Kpi label="Failed" value={stats.failureCount} tone="text-rose-700" />
        <Kpi label="Skipped" value={stats.skippedCount} tone="text-amber-700" />
        <Kpi
          label="Throughput / min"
          value={stats.throughputPerMinute}
          tone="text-sky-700"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Outcome mix
          </h2>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[entry.name as keyof typeof COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-slate-500">
            Duration: {stats.durationMs} ms
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Entity logs
            </h2>
            <select
              className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-semibold">Entity</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={`${log.entityId}-${log.processedAt}`}>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">
                      {log.entityId.slice(0, 12)}…
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {log.message || log.error || '—'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No logs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 font-display text-3xl tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
