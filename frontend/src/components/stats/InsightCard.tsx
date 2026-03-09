'use client';

export default function InsightCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{title}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
    </div>
  );
}
