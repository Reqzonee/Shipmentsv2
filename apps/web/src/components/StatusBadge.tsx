const styles: Record<string, string> = {
  queued: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-violet-100 text-violet-700',
  running: 'bg-sky-100 text-sky-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
  partial: 'bg-amber-100 text-amber-800',
  success: 'bg-emerald-100 text-emerald-800',
  skipped: 'bg-amber-100 text-amber-800',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        styles[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}
