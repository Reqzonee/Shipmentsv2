import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type EntityMeta } from '../lib/api';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';

export function CreateActionPage() {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<EntityMeta[]>([]);
  const [accountId, setAccountId] = useState('acc_demo');
  const [entityType, setEntityType] = useState('contact');
  const [filterStatus, setFilterStatus] = useState('');
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [queuePhase, setQueuePhase] = useState<'idle' | 'sending' | 'queued'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const current = useMemo(
    () => entities.find((e) => e.type === entityType),
    [entities, entityType]
  );

  const statusField = current?.fields.find((f) => f.key === 'status');
  const updatable = current?.fields.filter((f) => f.updatable) ?? [];

  useEffect(() => {
    api.listEntities().then((res) => {
      setEntities(res.data ?? []);
      const first = res.data?.[0];
      if (first) {
        setEntityType(first.type);
        const st = first.fields.find((f) => f.key === 'status');
        if (st?.enumValues?.[0]) setFilterStatus(st.enumValues[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (!current) return;
    const st = current.fields.find((f) => f.key === 'status');
    setFilterStatus(st?.enumValues?.[0] ?? '');
    setUpdates({});
  }, [entityType, current?.type]);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!accountId.trim() || !entityType) return;
      try {
        const res = await api.listEntityRecords(entityType, {
          accountId: accountId.trim(),
          status: filterStatus,
          page: 1,
          limit: 1,
        });
        if (!cancelled) setMatchCount(res.data?.pagination.total ?? 0);
      } catch {
        if (!cancelled) setMatchCount(null);
      }
    }
    const t = window.setTimeout(check, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [accountId, entityType, filterStatus]);

  function setUpdateField(key: string, value: string) {
    setUpdates((prev) => {
      const next = { ...prev };
      if (!value) delete next[key];
      else next[key] = value;
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (Object.keys(updates).length === 0) {
      setError('Select at least one field to update (name, email, status, …)');
      return;
    }
    setSubmitting(true);
    setQueuePhase('sending');
    setError(null);
    try {
      const parsedUpdates: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(updates)) {
        const field = updatable.find((f) => f.key === k);
        parsedUpdates[k] = field?.type === 'number' ? Number(v) : v;
      }
      const body: Record<string, unknown> = {
        accountId: accountId.trim(),
        entityType,
        actionType: 'bulk_update',
        filters: filterStatus ? { status: filterStatus } : {},
        updates: parsedUpdates,
      };
      if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();

      const res = await api.createAction(body);
      setQueuePhase('queued');
      await new Promise((r) => setTimeout(r, 600));
      navigate(`/actions/${res.data!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      setQueuePhase('idle');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="font-display text-3xl text-ink-950">Create bulk update</h1>
        <p className="mt-1 text-slate-600">
          Works across Contacts, Companies, Leads, Opportunities, and Tasks. Update
          multiple fields (name, email, status, …) in one queued job.
        </p>
      </header>

      <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <h2 className="text-sm font-semibold text-ink-900">Status / stage meanings</h2>
        <p className="mt-2 text-sm text-slate-600">
          Each CRM entity has its own lifecycle values (shown in the dropdowns below).
          Example for contacts:{' '}
          <StatusBadge status="active" /> engaged ·{' '}
          <StatusBadge status="inactive" /> paused ·{' '}
          <StatusBadge status="lead" /> potential.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          <strong>accountId</strong> = tenant/user bucket. Rate limit is{' '}
          <strong>10k events/min per accountId</strong> — many accounts can run jobs in
          parallel; each has its own quota.
        </p>
      </section>

      {queuePhase !== 'idle' && (
        <div className="mb-5 rounded-2xl border border-accent/30 bg-accent-soft p-5 shadow-panel">
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-accent-dark">
            <span>
              {queuePhase === 'sending' ? 'Sending job to queue…' : 'Queued — opening progress…'}
            </span>
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent" />
          </div>
          <ProgressBar
            value={queuePhase === 'sending' ? 40 : 100}
            animated={queuePhase === 'sending'}
          />
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-panel"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Account ID (tenant)">
            <input
              className="input"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            />
          </Field>
          <Field label="CRM entity">
            <select
              className="input"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              {entities.map((e) => (
                <option key={e.type} value={e.type}>
                  {e.collectionLabel}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Filter by status/stage (who to update)">
          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {(statusField?.enumValues ?? []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Fields to update (leave blank to skip)
          </p>
          <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            {updatable.map((field) => (
              <label key={field.key} className="block space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {field.label}
                </span>
                {field.type === 'enum' ? (
                  <select
                    className="input"
                    value={updates[field.key] ?? ''}
                    onChange={(e) => setUpdateField(field.key, e.target.value)}
                  >
                    <option value="">— no change —</option>
                    {(field.enumValues ?? []).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    type={field.type === 'number' ? 'number' : 'text'}
                    placeholder={`New ${field.label.toLowerCase()}`}
                    value={updates[field.key] ?? ''}
                    onChange={(e) => setUpdateField(field.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            matchCount === 0
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          {matchCount === null ? (
            'Checking matches…'
          ) : matchCount === 0 ? (
            <>
              0 matches for this account/entity/status.{' '}
              <Link to="/entities" className="font-semibold underline">
                Seed CRM data
              </Link>{' '}
              first.
            </>
          ) : (
            <>
              About <strong>{matchCount}</strong> {current?.collectionLabel.toLowerCase()} will
              be updated
              {Object.keys(updates).length
                ? ` (${Object.keys(updates).join(', ')})`
                : ''}
              .
            </>
          )}
        </div>

        <Field label="Schedule for later (optional — shows as future/scheduled)">
          <input
            type="datetime-local"
            className="input"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || matchCount === 0}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {submitting ? 'Queuing…' : 'Queue bulk action'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
