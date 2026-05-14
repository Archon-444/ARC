'use client';

import { ArrowRight, LoaderCircle, ShieldCheck, Wallet } from 'lucide-react';
import { ProfileGatewayState } from '@/lib/profile';

type Props = {
  state: ProfileGatewayState;
  walletAddress?: string;
  isSwitching?: boolean;
  onConnect: () => void | Promise<void>;
  onContinue?: () => void;
};

export function ProfileConnectionCard({
  state,
  walletAddress,
  onConnect,
  onContinue,
}: Props) {
  if (state === 'loading' || state === 'switching') {
    return (
      <div
        className="rounded-3xl border border-neutral-200/60 bg-neutral-50/80 p-6 dark:border-white/10 dark:bg-slate-950/60"
        data-testid="profile-gateway-loading-card"
      >
        <div className="mb-4 flex items-center gap-3 text-neutral-900 dark:text-white">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary-500" />
          <h2 className="text-xl font-semibold">
            {state === 'switching' ? 'Switching wallet' : 'Preparing your account'}
          </h2>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {state === 'switching'
            ? 'ARC is updating your wallet context and preparing the correct account handoff.'
            : 'ARC is checking your wallet state and preparing the best next account action.'}
        </p>
        <div className="mt-5 grid gap-3">
          <div className="h-12 rounded-2xl bg-neutral-200/80 dark:bg-white/10" />
          <div className="h-20 rounded-2xl bg-neutral-200/60 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  if (state === 'connected' || state === 'empty') {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50/70 p-6 dark:border-green-500/20 dark:bg-green-500/10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:border-green-500/20 dark:bg-slate-950/40 dark:text-green-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Connected
        </div>
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          {state === 'empty' ? 'Open your account workspace' : 'Continue to your wallet profile'}
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          {state === 'empty'
            ? 'Your wallet is connected. Open your profile to explore next actions and account utilities.'
            : 'Open your richer account workspace for holdings, listings, activity, and computed wallet metrics.'}
        </p>
        {walletAddress && (
          <div className="mt-4 rounded-2xl border border-green-200/70 bg-white/80 px-4 py-3 text-sm text-neutral-700 dark:border-green-500/20 dark:bg-slate-950/40 dark:text-neutral-200">
            <span className="font-mono">{walletAddress}</span>
          </div>
        )}
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-black"
          data-testid="profile-open-handoff"
        >
          Open my profile
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-6 dark:border-blue-500/20 dark:bg-blue-500/10">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-slate-950/40 dark:text-blue-300">
        <Wallet className="h-3.5 w-3.5" />
        Wallet required
      </div>
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
        Preview your account before you connect
      </h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        ARC keeps profile value visible up front so the page feels like an account gateway instead of a blocked screen.
      </p>
      <button
        type="button"
        onClick={onConnect}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
        data-testid="profile-connect-cta"
      >
        <Wallet className="h-4 w-4" />
        Connect wallet
      </button>
    </div>
  );
}
