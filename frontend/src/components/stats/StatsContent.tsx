'use client';

import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  Home,
  Loader2,
  Package,
  Radio,
  Rocket,
  Search,
  Sparkles,
  Trophy,
  User,
  Users,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { formatCompactUSDC, formatNumber } from '@/lib/utils';
import { LENS_LABELS, shortenAddress, type AnalyticsLens } from '@/lib/stats';
import { useStatsMetrics } from '@/hooks/useStatsMetrics';
import StatCard from '@/components/stats/StatCard';
import InsightCard from '@/components/stats/InsightCard';
import RouteCard from '@/components/stats/RouteCard';
import ActionReadCard from '@/components/stats/ActionReadCard';
import MiniSignal from '@/components/stats/MiniSignal';

export default function StatsContent() {
  const {
    address,
    isConnected,
    stats,
    isLoading,
    error,
    analyticsLens,
    setAnalyticsLens,
    loadStats,
    totalInventory,
    auctionShare,
    listingShare,
    marketMode,
    dailyVolumeShare,
    statCards,
    computedSignals,
    stateTone,
    stateTitle,
    stateDescription,
    lensSummary,
  } = useStatsMetrics();

  if (isLoading && !stats) {
    return <LoadingPage label="Loading ARC stats..." />;
  }

  const shellRoutes = [
    {
      title: 'Open home',
      description: 'Return to the connected ARC entry surface after reviewing analytics.',
      href: '/',
      icon: <Home className="h-4 w-4" />,
    },
    {
      title: 'Open profile',
      description: 'Return to the wallet-linked account surface from analytics.',
      href: address ? `/profile/${address}` : '/profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      title: 'Open rewards',
      description: 'Move from market context into loyalty and wallet-linked progression.',
      href: '/rewards',
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      title: 'Token markets',
      description: 'Go straight from analytics into launched-token discovery.',
      href: '/explore?tab=tokens',
      icon: <Wallet className="h-4 w-4" />,
    },
  ];

  const pulseRows = [
    {
      title: 'Marketplace depth',
      description: stats
        ? `${formatNumber(totalInventory)} active inventory slots are live across listings and auctions.`
        : 'Track active listings and rotating auction inventory across ARC.',
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: 'Launchpad momentum',
      description: stats
        ? `${formatNumber(stats.totalSales)} total sales currently underpin the ARC analytics surface.`
        : 'Use the stats surface as the analytics layer behind token discovery and launches.',
      icon: <Rocket className="h-4 w-4" />,
    },
    {
      title: 'Wallet-native activity',
      description: isConnected
        ? `Analytics is currently anchored to ${shortenAddress(address)} as the active shell identity.`
        : 'Keep market review, account context, and discovery behavior aligned in one shell.',
      icon: <Wallet className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
        <div className="mb-8 grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <BarChart3 className="h-3.5 w-3.5" />
              ARC analytics
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Review marketplace, launchpad, and shell momentum in one ARC stats surface.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              The stats route now works as the analytics layer for Phase 1, connecting live totals, computed composition signals, and the next best ARC route from a single destination.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
              >
                <Home className="h-4 w-4" />
                Back to home
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                <Search className="h-4 w-4" />
                Explore markets
              </Link>
              <Link
                href="/launch"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                <Rocket className="h-4 w-4" />
                Launch a token
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-white/10 dark:bg-slate-950/60">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Market pulse</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                <Radio className="h-3.5 w-3.5" />
                Live
              </span>
            </div>
            <div className="space-y-3">
              {pulseRows.map((row) => (
                <div key={row.title} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                      {row.icon}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-white">{row.title}</div>
                      <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{row.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
          <div
            className={
              stateTone === 'red'
                ? 'rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
                : stateTone === 'blue'
                  ? 'rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
                  : stateTone === 'green'
                    ? 'rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300'
                    : 'rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-neutral-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300'
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  {stateTone === 'red' ? (
                    <Activity className="h-4 w-4" />
                  ) : stateTone === 'blue' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Analytics state
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-white">{stateTitle}</div>
                <p className="mt-1 max-w-3xl text-sm text-current">{stateDescription}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    void loadStats();
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5"
                >
                  <Activity className="h-4 w-4" />
                  Refresh stats
                </button>
                <Link
                  href="/explore?tab=tokens"
                  className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black"
                >
                  <Wallet className="h-4 w-4" />
                  Token markets
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  <Sparkles className="h-4 w-4" />
                  Shell continuity
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {isConnected ? 'Wallet-linked analytics route' : 'Analytics route ready'}
                </div>
                <p className="mt-1 max-w-3xl text-sm text-current">
                  {isConnected
                    ? `Analytics is currently aligned with ${shortenAddress(address)} so users can move from stats into profile, rewards, home, and token markets without losing shell context.`
                    : 'Analytics is now wired as a stronger shell destination, with route continuity into home, profile, rewards, token markets, and launch flows.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={address ? `/profile/${address}` : '/profile'}
                  className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/rewards"
                  className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5"
                >
                  <Trophy className="h-4 w-4" />
                  Rewards
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-neutral-200/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Analytics lens</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Switch the interpretation mode without implying separate backend time windows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['overview', 'inventory', 'flow', 'shell'] as AnalyticsLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => setAnalyticsLens(lens)}
                className={
                  analyticsLens === lens
                    ? 'rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black'
                    : 'rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300 dark:hover:text-white'
                }
              >
                {LENS_LABELS[lens]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Current lens
              </div>
              <div className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{LENS_LABELS[analyticsLens]}</div>
              <p className="mt-1 max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">{lensSummary}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniSignal label="Market mode" value={marketMode} />
              <MiniSignal label="24h volume share" value={dailyVolumeShare} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <section className="mt-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4">
            <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Computed signals</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              These derived reads turn the stats route into a more decision-useful analytics destination.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {computedSignals.map((signal) => (
              <InsightCard
                key={signal.title}
                title={signal.title}
                value={signal.value}
                description={signal.description}
              />
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Market interpretation</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  A clearer computed read on what today's ARC market shape suggests.
                </p>
              </div>
              <Activity className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InsightCard
                title="Inventory mode"
                value={marketMode}
                description="This reads the current balance between fixed-price listings and timed auctions."
              />
              <InsightCard
                title="Trade depth"
                value={stats ? formatNumber(stats.totalSales) : '0'}
                description="Sales count remains the simplest live proxy for how much real usage has already flowed through the market."
              />
              <InsightCard
                title="Listing inventory"
                value={stats ? formatNumber(stats.activeListings) : '0'}
                description="Fixed-price depth now feeds directly into the computed composition signal."
              />
              <InsightCard
                title="Auction inventory"
                value={stats ? formatNumber(stats.activeAuctions) : '0'}
                description="Timed inventory gives a second view on urgency and discovery dynamics."
              />
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Analytics routes</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Move directly from stats into the highest-value ARC flows.
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="space-y-3">
              {shellRoutes.map((route) => (
                <RouteCard
                  key={route.title}
                  title={route.title}
                  description={route.description}
                  href={route.href}
                  icon={route.icon}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Actionable reads</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Short summaries that turn live totals into immediate product interpretation.
              </p>
            </div>
            <Users className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <ActionReadCard
              title="Liquidity posture"
              description={
                stats
                  ? `${formatCompactUSDC(stats.totalVolume)} in total volume is currently visible across ARC marketplace activity.`
                  : 'Waiting on live volume.'
              }
              badge="Live"
            />
            <ActionReadCard
              title="Inventory balance"
              description={
                stats
                  ? `${listingShare}% of active inventory is fixed-price while ${auctionShare}% is auction-driven.`
                  : 'Waiting on inventory mix.'
              }
              badge="Computed"
            />
            <ActionReadCard
              title="Route priority"
              description={
                isConnected
                  ? 'Home, profile, rewards, and token markets are now the best follow-on routes from analytics for the connected shell.'
                  : 'Home, explore, launch, rewards, and token markets remain the best follow-on routes from analytics.'
              }
              badge="Shell"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
