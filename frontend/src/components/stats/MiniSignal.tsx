'use client';

export default function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{value}</div>
    </div>
  );
}
