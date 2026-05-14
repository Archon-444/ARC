'use client';

export default function ActionReadCard({ title, description, badge }: { title: string; description: string; badge: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
        <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-500 dark:border-white/10 dark:bg-slate-900 dark:text-neutral-400">
          {badge}
        </span>
      </div>
    </div>
  );
}
