'use client';

import { useState, useEffect, type ComponentType } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
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
} from 'lucide-react';
import { fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatCompactUSDC, formatNumber } from '@/lib/utils';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import type { MarketplaceStats } from '@/types';

type AnalyticsLens = 'overview' | 'inventory' | 'flow' | 'shell';

const LENS_LABELS: Record<AnalyticsLens, string> = {
  overview: 'Overview',
  inventory: 'Inventory',
  flow: 'Flow',
  shell: 'Shell routes',
};

function shortenAddress(address?: string | null) {
  if (!address) return 'No wallet connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function StatsPage() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLens, setAnalyticsLens] = useState<AnalyticsLens>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketplaceStats();
      setStats(data);
    } catch (loadError) {
      console.error('Failed to load stats:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load ARC stats right now.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !stats) {
    return <LoadingPage label="Loading ARC stats..." />;
  }

  const totalInventory = stats ? stats.activeListings + stats.activeAuctions : 0;
  const auctionShare = totalInventory > 0 && stats ? Math.round((stats.activeAuctions / totalInventory) * 100) : 0;
  const listingShare = totalInventory > 0 && stats ? 100 - auctionShare : 0;
  const salesPerInventory = totalInventory > 0 && stats ? (stats.totalSales / totalInventory).toFixed(1) : '0.0';
  const marketMode = !stats
    ? 'Waiting on analytics'
    : stats.activeAuctions > stats.activeListings
      ? 'Auction-heavy'
      : stats.activeListings > stats.activeAuctions * 2
        ? 'Listing-heavy'
        : 'Balanced inventory';
  const dailyVolumeShare = stats && stats.totalVolume !== '0'
    ? `${Math.min(100, Math.round((Number(stats.dailyVolume) / Number(stats.totalVolume)) * 100))}%`
    : '0%';

  const statCards = [
    {
      title: 'Total volume',
      value: stats ? formatCompactUSDC(stats.totalVolume) : '$0',
      supportingLabel: 'Live marketplace read',
      icon: DollarSign,
      tone: 'green' as const,
    },
    {
      title: 'Total sales',
      value: stats ? formatNumber(stats.totalSales) : '0',
      supportingLabel: 'Marketplace transactions',
      icon: Package,
      tone: 'blue' as const,
    },
    {
      title: 'Active listings',
      value: stats ? formatNumber(stats.activeListings) : '0',
      supportingLabel: 'Current fixed-price inventory',
      icon: BarChart3,
      tone: 'purple' as const,
    },
    {
      title: 'Active auctions',
      value: stats ? formatNumber(stats.activeAuctions) : '0',
      supportingLabel: 'Current timed inventory',
      icon: Clock,
      tone: 'orange' as const,
    },
  ];

  const computedSignals = [
    {
      title: 'Total inventory',
      value: formatNumber(totalInventory),
      description: 'Combined listings and auctions available in the current ARC market state.',
    },
    {
      title: 'Listing share',
      value: `${listingShare}%`,
      description: 'How much of visible inventory is currently fixed-price supply.',
    },
    {
      title: 'Auction share',
      value: `${auctionShare}%`,
      description: 'How much of visible inventory is currently timed-market supply.',
    },
    {
      title: 'Sales per inventory',
      value: salesPerInventory,
      description: 'A simple turnover proxy using total sales divided by active inventory.',
    },
  ];

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

  const stateTone = error ? 'red' : isLoading ? 'blue' : stats ? 'green' : 'neutral';
  const stateTitle = error
    ? 'Analytics unavailable'
    : isLoading
      ? 'Refreshing analytics'
      : stats
        ? 'Analytics ready'
        : 'Waiting on analytics';
  const stateDescription = error
    ? 'ARC could not load the stats surface right now. You can retry below or route back into discovery and launch flows.'
    : isLoading
      ? 'ARC is refreshing marketplace totals and activity signals for this analytics view.'
      : stats
        ? 'This surface now acts as the Phase 1 analytics destination, tying computed market signals back into the connected shell and its highest-value follow-on routes.'
        : 'Stats will appear here once marketplace data is available.';

  const lensSummary = {
    overview: 'See the broad marketplace picture first, then branch into action.',
    inventory: 'Focus on supply mix, market shape, and inventory composition.',
    flow: 'Center on velocity, turnover, and how volume translates into activity.',
    shell: 'Use stats as a routing surface back into home, profile, rewards, and token discovery.',
  }[analyticsLens];

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
          <div className={stateTone === 'red'
            ? 'rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
            : stateTone === 'blue'
              ? 'rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
              : stateTone === 'green'
                ? 'rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300'
                : 'rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-neutral-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300'}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                  {stateTone === 'red' ? <Activity className="h-4 w-4" /> : stateTone === 'blue' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Analytics state
                </div>
                <div className="text-lg font-semibold text-neutral-900 dark:text-white">{stateTitle}</div>
                <p className="mt-1 max-w-3xl text-sm text-current">{stateDescription}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={loadStats}
                  className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5"
                >
                  <Activity className="h-4 w-4" />
                  Refresh stats
                </button>
                <Link href="/explore?tab=tokens" className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
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
                <Link href={address ? `/profile/${address}` : '/profile'} className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link href="/rewards" className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5">
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
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Switch the interpretation mode without implying separate backend time windows.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['overview', 'inventory', 'flow', 'shell'] as AnalyticsLens[]).map((lens) => (
              <button
                key={lens}
                onClick={() => setAnalyticsLens(lens)}
                className={analyticsLens === lens
                  ? 'rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black'
                  : 'rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300 dark:hover:text-white'}
              >
                {LENS_LABELS[lens]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Current lens</div>
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
            <p className="text-sm text-neutral-500 dark:text-neutral-400">These derived reads turn the stats route into a more decision-useful analytics destination.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {computedSignals.map((signal) => (
              <InsightCard key={signal.title} title={signal.title} value={signal.value} description={signal.description} />
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Market interpretation</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">A clearer computed read on what today’s ARC market shape suggests.</p>
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
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Move directly from stats into the highest-value ARC flows.</p>
              </div>
              <Sparkles className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="space-y-3">
              {shellRoutes.map((route) => (
                <RouteCard key={route.title} title={route.title} description={route.description} href={route.href} icon={route.icon} />
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Actionable reads</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Short summaries that turn live totals into immediate product interpretation.</p>
            </div>
            <Users className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <ActionReadCard
              title="Liquidity posture"
              description={stats ? `${formatCompactUSDC(stats.totalVolume)} in total volume is currently visible across ARC marketplace activity.` : 'Waiting on live volume.'}
              badge="Live"
            />
            <ActionReadCard
              title="Inventory balance"
              description={stats ? `${listingShare}% of active inventory is fixed-price while ${auctionShare}% is auction-driven.` : 'Waiting on inventory mix.'}
              badge="Computed"
            />
            <ActionReadCard
              title="Route priority"
              description={isConnected ? 'Home, profile, rewards, and token markets are now the best follow-on routes from analytics for the connected shell.' : 'Home, explore, launch, rewards, and token markets remain the best follow-on routes from analytics.'}
              badge="Shell"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
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
  const toneClasses = {
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
  } as const;

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

function InsightCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{title}</div>
      <div className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
    </div>
  );
}

function RouteCard({ title, description, href, icon }: { title: string; description: string; href: string; icon: JSX.Element }) {
  return (
    <Link href={href} className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-primary-400 hover:bg-white dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
            {icon}
          </div>
          <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-neutral-400" />
      </div>
    </Link>
  );
}

function ActionReadCard({ title, description, badge }: { title: string; description: string; badge: string }) {
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

function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{value}</div>
    </div>
  );
}
