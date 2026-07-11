import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ProgressBar } from '../components/ProgressBar';
import { StatusBadge } from '../components/StatusBadge';

export function CreateActionPage() {
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState('acc_demo');
  const [filterStatus, setFilterStatus] = useState('inactive');
  const [updateStatus, setUpdateStatus] = useState('active');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [queuePhase, setQueuePhase] = useState<'idle' | 'sending' | 'queued'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  // Live preview: how many contacts would this job hit?
  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!accountId.trim()) {
        setMatchCount(null);
        return;
      }
      setChecking(true);
      try {
        const res = await api.listContacts({
          accountId: accountId.trim(),
          status: filterStatus,
          page: 1,
          limit: 1,
        });
        if (!cancelled) setMatchCount(res.data?.pagination.total ?? 0);
      } catch {
        if (!cancelled) setMatchCount(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    const t = window.setTimeout(check, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [accountId, filterStatus]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setQueuePhase('sending');
    setError(null);
    try {
      const body: Record<string, unknown> = {
        accountId: accountId.trim(),
        entityType: 'contact',
        actionType: 'bulk_update',
        filters: { status: filterStatus },
        updates: { status: updateStatus },
      };
      if (scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      }
      const res = await api.createAction(body);
      setQueuePhase('queued');
      await new Promise((r) => setTimeout(r, 700));
      navigate(`/actions/${res.data!.id}`);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Create failed';
      if (raw.toLowerCase().includes('no contacts matched')) {
        setError(
          `No contacts found for account "${accountId.trim()}" with status "${filterStatus}". ` +
            `Seed contacts for this Account ID on the Contacts page (or use acc_demo), then try again.`
        );
      } else {
        setError(raw);
      }
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
          Pick who to change (filter) and what to set. The job goes into a queue so the
          website stays fast while thousands of rows update in the background.
        </p>
      </header>

      <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <h2 className="text-sm font-semibold text-ink-900">Status meanings</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li className="flex flex-wrap items-center gap-2">
            <StatusBadge status="active" />
            <span>Engaged / usable customer right now</span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <StatusBadge status="inactive" />
            <span>Paused / not engaged — common target for “wake up” bulk updates</span>
          </li>
          <li className="flex flex-wrap items-center gap-2">
            <StatusBadge status="lead" />
            <span>Potential customer, not converted yet</span>
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Example: filter <strong>inactive</strong> → change to <strong>active</strong>.
          Account ID must match the account you seeded (default seed uses{' '}
          <code className="rounded bg-slate-100 px-1">acc_demo</code>).
        </p>
      </section>

      {queuePhase !== 'idle' && (
        <div className="mb-5 rounded-2xl border border-accent/30 bg-accent-soft p-5 shadow-panel">
          <div className="mb-2 flex items-center justify-between text-sm font-medium text-accent-dark">
            <span>
              {queuePhase === 'sending'
                ? 'Sending job to queue…'
                : 'Accepted — opening live progress…'}
            </span>
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent" />
          </div>
          <ProgressBar
            value={queuePhase === 'sending' ? 35 : 100}
            animated={queuePhase === 'sending'}
          />
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-panel"
      >
        <Field label="Account ID">
          <input
            className="input"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Must match contacts you already seeded. Wrong ID = zero matches.
          </p>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Who to update (filter status)">
            <select
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="inactive">inactive — paused / not engaged</option>
              <option value="active">active — currently engaged</option>
              <option value="lead">lead — potential customer</option>
            </select>
          </Field>
          <Field label="Change their status to">
            <select
              className="input"
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
            >
              <option value="active">active — mark as engaged</option>
              <option value="inactive">inactive — mark as paused</option>
              <option value="lead">lead — mark as potential</option>
            </select>
          </Field>
        </div>

        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            matchCount === 0
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          {checking ? (
            'Checking how many contacts match…'
          ) : matchCount === null ? (
            'Enter an Account ID to preview matches.'
          ) : matchCount === 0 ? (
            <>
              <strong>0 contacts</strong> match account{' '}
              <code className="rounded bg-white/80 px-1">{accountId}</code> + status{' '}
              <strong>{filterStatus}</strong>.{' '}
              <Link to="/contacts" className="font-semibold underline">
                Go seed contacts
              </Link>{' '}
              for this account, or switch Account ID to <code>acc_demo</code>.
            </>
          ) : (
            <>
              This job will update about <strong>{matchCount}</strong> contact
              {matchCount === 1 ? '' : 's'} ({filterStatus} → {updateStatus}).
            </>
          )}
        </div>

        <Field label="Schedule for later (optional)">
          <input
            type="datetime-local"
            className="input"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Leave empty to run immediately. If set in the future, status starts as
            scheduled.
          </p>
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
