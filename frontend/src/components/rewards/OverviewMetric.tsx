'use client';

export default function OverviewMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{hint}</div>
    </div>
  );
}
