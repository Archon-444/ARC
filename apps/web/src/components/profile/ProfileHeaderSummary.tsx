'use client';

import Link from 'next/link';
import { ArrowRight, Copy, Settings, ShieldCheck, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type SummaryAction = {
  key: string;
  label: string;
  href: string;
};

type Props = {
  displayName?: string;
  walletAddress: string;
  isOwnProfile?: boolean;
  copied?: boolean;
  onCopy?: () => void;
  actions?: SummaryAction[];
};

export function ProfileHeaderSummary({
  displayName,
  walletAddress,
  isOwnProfile,
  copied,
  onCopy,
  actions = [],
}: Props) {
  return (
    <div className="grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
          <User className="h-3.5 w-3.5" />
          ARC account
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-4xl">
          {displayName || (isOwnProfile ? 'Your ARC account' : walletAddress)}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="font-mono">{walletAddress}</span>
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200 dark:hover:text-primary-300"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy address'}
          </button>
        </div>

        <p className="mt-4 max-w-2xl text-neutral-600 dark:text-neutral-400">
          Track holdings, listings, rewards, and wallet activity in one place.
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-white/10 dark:bg-slate-950/60">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Account utilities</h2>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
              isOwnProfile
                ? 'border border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300'
                : 'border border-neutral-200 bg-white text-neutral-600 dark:border-white/10 dark:bg-slate-900 dark:text-neutral-300'
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {isOwnProfile ? 'Connected identity' : 'Public wallet view'}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/profile" className="inline-flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
            Account gateway
            <ArrowRight className="h-4 w-4" />
          </Link>

          {actions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className="inline-flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 transition hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-white"
            >
              {action.label}
              {action.key === 'settings' ? <Settings className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
