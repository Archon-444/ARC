'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { QuickAction } from '@/lib/profile';

type Props = {
  actions: QuickAction[];
  variant?: 'default' | 'compact';
};

export function ProfileQuickActions({ actions }: Props) {
  return (
    <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Account utilities</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Keep rewards, settings, discovery, and launch flows connected to the same account journey.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          if (action.href) {
            return (
              <Link
                key={action.key}
                href={action.href}
                className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-primary-400 hover:bg-white dark:border-white/10 dark:bg-slate-950/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-neutral-900 dark:text-white">{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-neutral-400" />
                </div>
              </Link>
            );
          }

          return (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:border-primary-400 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/60"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-neutral-900 dark:text-white">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-neutral-400" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
