'use client';

import type { ComponentType } from 'react';

const toneClasses = {
  green: 'bg-green-500/10 text-green-500',
  blue: 'bg-blue-500/10 text-blue-500',
  purple: 'bg-purple-500/10 text-purple-500',
  orange: 'bg-orange-500/10 text-orange-500',
} as const;

export default function StatCard({
  title,
  value,
  supportingLabel,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  supportingLabel: string;
  icon: ComponentType<{ className?: string }>;
  tone: 'green' | 'blue' | 'purple' | 'orange';
}) {
  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{supportingLabel}</div>
    </div>
  );
}
