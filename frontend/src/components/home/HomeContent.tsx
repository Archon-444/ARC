'use client';

import Link from 'next/link';
import { ArrowRight, Rocket, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useHomeData } from '@/hooks/useHomeData';
import {
  HERO_KPIS,
  FEED_LABELS,
  READINESS_ITEMS,
} from '@/lib/home';
import type { FeedTab } from '@/lib/home';
import { LauncherTokenGrid } from '@/components/token/LauncherTokenCard';
import ReadinessRow from './ReadinessRow';

export default function HomeContent() {
  const { loading, error, feedTab, setFeedTab, feedCards, headlineSummary } = useHomeData();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_35%),radial-gradient(circle_at_right,_rgba(168,85,247,0.10),_transparent_25%)]">
      <section className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            USDC token launcher
          </div>
          <h1 className="mb-4 max-w-4xl text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
            Creators earn on every trade. Traders buy a live curve.
          </h1>
          <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
            Launch a coin in USDC, share the link, trade the bonding curve. Unsold supply cannot be yanked as a rug.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/launch" className="inline-flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Launch a token
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/explore?tab=tokens" className="inline-flex items-center gap-2">
                Explore tokens
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">{headlineSummary}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {HERO_KPIS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-slate-950/60"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    {item.label}
                  </div>
                  <div className="mt-1 font-semibold text-neutral-900 dark:text-white">{item.value}</div>
                  <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{item.hint}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-12">
        {error && (
          <div className="mb-6 rounded-2xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Token board</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {FEED_LABELS[feedTab].subtitle}
              </p>
            </div>
            <div className="flex gap-2">
              {(['new', 'hot', 'graduating'] as FeedTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFeedTab(tab)}
                  className={
                    feedTab === tab
                      ? 'rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black'
                      : 'rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300 dark:hover:text-white'
                  }
                >
                  {tab === 'new' ? 'New' : tab === 'hot' ? 'Hot' : 'Graduating'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <LauncherTokenGrid tokens={[]} isLoading />
          ) : feedCards.length > 0 ? (
            <LauncherTokenGrid tokens={feedCards} />
          ) : (
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-white/10 dark:bg-slate-950/60">
              <p className="text-neutral-600 dark:text-neutral-400">No tokens on this board yet.</p>
              <Button asChild className="mt-4">
                <Link href="/launch" className="inline-flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Launch the first
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">How it works</h2>
          <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
            {READINESS_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <ReadinessRow
                  key={item.title}
                  icon={<Icon className="h-4 w-4" />}
                  title={item.title}
                  detail={item.detail}
                />
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
