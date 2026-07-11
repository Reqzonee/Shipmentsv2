export function ProgressBar({
  value,
  animated = false,
}: {
  value: number;
  animated?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const showPulse = animated && pct < 100;

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={`relative h-full rounded-full bg-accent transition-all duration-500 ease-out ${
          showPulse ? 'progress-glow' : ''
        }`}
        style={{ width: `${Math.max(pct, showPulse && pct === 0 ? 8 : pct)}%` }}
      >
        {showPulse && <span className="progress-shimmer" aria-hidden />}
      </div>
    </div>
  );
}
