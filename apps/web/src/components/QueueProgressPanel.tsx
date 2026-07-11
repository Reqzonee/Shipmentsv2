import { StatusBadge } from './StatusBadge';
import { ProgressBar } from './ProgressBar';

const STEPS = [
  { key: 'queued', label: 'Queued' },
  { key: 'running', label: 'Processing' },
  { key: 'done', label: 'Done' },
] as const;

function stepIndex(status: string): number {
  if (status === 'scheduled' || status === 'queued') return 0;
  if (status === 'running') return 1;
  return 2;
}

export function QueueProgressPanel({
  status,
  processed,
  total,
  progressPercent,
}: {
  status: string;
  processed: number;
  total: number;
  progressPercent: number;
}) {
  const active = stepIndex(status);
  const inFlight = status === 'queued' || status === 'running' || status === 'scheduled';
  const finished = !inFlight;
  // Prefer honest math; if finished, show 100% only when processed covers total
  const displayPct = finished
    ? total > 0
      ? Math.min(100, Math.round((processed / total) * 100))
      : 100
    : progressPercent;
  const incomplete = finished && total > 0 && processed < total;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-panel">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Queue pipeline
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {status === 'queued' && 'Job is waiting in Redis for a worker…'}
            {status === 'scheduled' && 'Job is scheduled — waiting for start time…'}
            {status === 'running' && 'Worker is updating contacts in batches…'}
            {status === 'completed' &&
              !incomplete &&
              'All matching contacts finished successfully.'}
            {status === 'completed' &&
              incomplete &&
              `Worker stopped early: updated ${processed} of ${total} planned contacts. Run a new bulk action to finish the rest (fixed in latest worker).`}
            {status === 'partial' && 'Finished with some failures.'}
            {status === 'failed' && 'Job failed — check error details.'}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <ol className="mb-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => {
          const done = i < active || (!inFlight && i <= active);
          const current = i === active && inFlight;
          return (
            <li
              key={step.key}
              className={`rounded-xl border px-4 py-3 transition ${
                current
                  ? 'border-accent bg-accent-soft shadow-sm'
                  : done
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    current
                      ? 'animate-pulse bg-accent text-white'
                      : done
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {done && !current ? '✓' : i + 1}
                </span>
                <span className="text-sm font-semibold text-ink-900">{step.label}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          {inFlight ? 'Live progress' : 'Final progress'}
        </span>
        <span className="tabular-nums text-slate-500">
          {processed}/{total} ({displayPct}%)
        </span>
      </div>
      <ProgressBar value={displayPct} animated={inFlight} />

      {incomplete && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Progress is <strong>{processed}/{total}</strong> because the job planned{' '}
          {total} matches at start, but only {processed} were updated before the worker
          stopped. An older skip-paging bug caused this when changing status. New jobs are
          fixed — queue another inactive→active update to finish remaining contacts.
        </p>
      )}

      {inFlight && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent" />
          Refreshing every 1 second while the queue is active
        </div>
      )}
    </section>
  );
}
