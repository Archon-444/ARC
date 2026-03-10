'use client';

import type { ReactNode } from 'react';

export default function FeedMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-white/10 dark:bg-slate-900/80">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-neutral-900 dark:text-white">{value}</div>
    </div>
  );
}
