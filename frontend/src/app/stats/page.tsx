'use client';

import { useState, useEffect, type ComponentType } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock,
  DollarSign,
  Package,
  Radio,
  Rocket,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatCompactUSDC, formatNumber } from '@/lib/utils';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import type { MarketplaceStats } from '@/types';

type TimeRange = '24h' | '7d' | '30d' | 'all';

const RANGE_LABELS: Record<TimeRange, string> = {
  '24h': '24H',
  '7d': '7D',
  '30d': '30D',
  all: 'All time',
};

export default function StatsPage() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMarketplaceStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingPage label="Loading ARC stats..." />;
  }

  const statCards = [
    {
      title: 'Total volume',
      value: stats ? formatCompactUSDC(stats.totalVolume) : '$0',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      tone: 'green' as const,
    },
    {
      title: 'Total sales',
      value: stats ? formatNumber(stats.totalSales) : '0',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Package,
      tone: 'blue' as const,
    },
    {
      title: 'Active listings',
      value: stats ? formatNumber(stats.activeListings) : '0',
      change: '-2.1%',
      trend: 'down' as const,
      icon: BarChart3,
      tone: 'purple' as const,
    },
    {
      title: 'Active auctions',
      value: stats ? formatNumber(stats.activeAuctions) : '0',
      change: '+15.3%',
      trend: 'up' as const,
      icon: Clock,
      tone: 'orange' as const,
    },
  ];

  const pulseRows = [
    {
      title: 'Marketplace depth',
      description: 'Track active listings and rotating auction inventory across ARC.',
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: 'Launchpad momentum',
      description: 'Use the stats surface as the analytics layer behind token discovery and launches.',
      icon: <Rocket className="h-4 w-4" />,
    },
    {
      title: 'Wallet-native activity',
      description: 'Keep market review, account context, and discovery behavior aligned in one shell.',
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
              Review marketplace, launchpad, and trading momentum in one ARC stats surface.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              The stats layer gives ARC users a cleaner read on volume, sales activity, listings, and auction depth without leaving the core shell.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary-500 px-6 py-3 font-semibold text-white transition hover:bg-primary-600"
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

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-neutral-200/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Time range</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Switch the analytics window while keeping the ARC shell layout consistent.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={timeRange === range
                  ? 'rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black'
                  : 'rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300 dark:hover:text-white'}
              >
                {RANGE_LABELS[range]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Volume view</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">A stronger chart layer can plug into this upgraded analytics surface next.</p>
              </div>
              <Activity className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="flex h-56 items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 text-center dark:border-white/10 dark:bg-slate-950/60">
              <div>
                <p className="text-base font-medium text-neutral-900 dark:text-white">Chart module ready for upgrade</p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">The shell is now in place for richer ARC volume and trading visualizations.</p>
              </div>
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
              <RouteCard title="Open explore" description="Return to marketplace inventory and launched token discovery." href="/explore" icon={<Search className="h-4 w-4" />} />
              <RouteCard title="Open rewards" description="Jump into loyalty progression, quests, and leaderboard surfaces." href="/rewards" icon={<Users className="h-4 w-4" />} />
              <RouteCard title="Launch a token" description="Move from analytics into the ARC launch flow." href="/launch" icon={<Rocket className="h-4 w-4" />} />
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-neutral-900 dark:text-white">Recent activity</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">A cleaner placeholder state that matches the upgraded ARC shell.</p>
            </div>
            <Users className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">Activity slot {item}</div>
                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Recent fills, listings, and account-level movement can surface here.</div>
                  </div>
                  <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-500 dark:border-white/10 dark:bg-slate-900 dark:text-neutral-400">
                    Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
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
      <div className="mt-3 flex items-center gap-1.5 text-sm">
        {trend === 'up' ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={trend === 'up' ? 'font-medium text-green-500' : 'font-medium text-red-500'}>{change}</span>
        <span className="text-neutral-500 dark:text-neutral-400">vs previous window</span>
      </div>
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
