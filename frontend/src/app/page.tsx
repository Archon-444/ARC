'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Flame,
  Layers3,
  LineChart,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { fetchListings, fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatCompactUSDC, formatUSDC } from '@/lib/utils';
import type { Listing } from '@/types';

interface MarketplaceStats {
  totalVolume: string;
  dailyVolume: string;
  totalSales: number;
  dailySales: number;
  activeListings: number;
  activeAuctions: number;
}

type FeedTab = 'new' | 'hot' | 'graduating';

const HERO_KPIS = [
  {
    label: 'Launch to market',
    value: 'Creator flow already live',
    hint: 'Start from launch, resolve into token routes, and carry context forward.',
    icon: Rocket,
  },
  {
    label: 'Discovery shell',
    value: 'Homepage as command center',
    hint: 'Move between fresh launches, momentum, stats, and next-step routes without friction.',
    icon: Radio,
  },
  {
    label: 'Trust + action',
    value: 'Signals before execution',
    hint: 'Market pulse, route continuity, and trader cues reduce hesitation before entry.',
    icon: Shield,
  },
];

const FEED_LABELS: Record<FeedTab, { title: string; subtitle: string }> = {
  new: {
    title: 'New launches',
    subtitle: 'Fresh markets with the earliest price discovery.',
  },
  hot: {
    title: 'Hot right now',
    subtitle: 'Tokens and collections with the strongest recent momentum.',
  },
  graduating: {
    title: 'Near graduation',
    subtitle: 'Markets closing in on the bonding-curve threshold.',
  },
};

const CONNECTED_SURFACES = [
  {
    title: 'Launch flow',
    description: 'Open the guided creator route and move directly into live token markets.',
    href: '/launch',
    cta: 'Open launch',
    icon: Rocket,
  },
  {
    title: 'Explore',
    description: 'Jump into the broader discovery surface for listings, auctions, and token routes.',
    href: '/explore',
    cta: 'Browse markets',
    icon: Layers3,
  },
  {
    title: 'Stats',
    description: 'Track the macro picture behind ARC activity and use it to frame trading decisions.',
    href: '/stats',
    cta: 'View stats',
    icon: BarChart3,
  },
  {
    title: 'Rewards',
    description: 'Stay connected to retention and participation loops after discovery and trading.',
    href: '/rewards',
    cta: 'Open rewards',
    icon: Wallet,
  },
];

const READINESS_ITEMS = [
  {
    title: 'Entry route upgraded',
    detail: 'Homepage now behaves like a shell surface, not just a feed teaser.',
    icon: Sparkles,
  },
  {
    title: 'Action paths nearby',
    detail: 'Launch, explore, stats, and rewards stay one click away from the primary entry point.',
    icon: ArrowRight,
  },
  {
    title: 'Signals before conviction',
    detail: 'Pulse metrics, live tape, and feed segmentation help frame urgency and momentum.',
    icon: TrendingUp,
  },
  {
    title: 'Next in order',
    detail: 'After homepage, Phase 1 continues into the shared layout shell and then stats.',
    icon: Clock3,
  },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>('new');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingsData, statsData] = await Promise.all([
        fetchListings({
          first: 24,
          skip: 0,
          orderBy: 'createdAt',
          orderDirection: 'desc',
        }),
        fetchMarketplaceStats(),
      ]);

      setListings(listingsData || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load home page data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const cards = useMemo(() => {
    return listings.slice(0, 12).map((listing, index) => {
      const createdAt = Number(listing.createdAt) * 1000;
      const mintedAgo = `${Math.max(1, Math.floor((Date.now() - createdAt) / 60000))}m ago`;
      const base = Number(listing.price) / 1_000_000;
      const hotness = 55 + ((index * 7) % 32);
      const curveProgress = 46 + ((index * 9) % 42);

      return {
        id: listing.id,
        href: `/token/${listing.tokenId || listing.id}`,
        name: listing.nft?.name || `ARC Launch #${String(index + 1).padStart(2, '0')}`,
        collection: listing.nft?.collection?.name || 'Arc Launchpad',
        price: formatUSDC(BigInt(listing.price)),
        basePrice: `$${base.toFixed(base >= 1 ? 2 : 4)}`,
        volume: `$${(base * (12 + index * 2)).toFixed(2)}K`,
        traders: 18 + index * 7,
        comments: 4 + index * 3,
        age: mintedAgo,
        hotness,
        curveProgress,
        badge:
          curveProgress > 75
            ? 'Near graduation'
            : hotness > 72
              ? 'Momentum'
              : 'Fresh launch',
      };
    });
  }, [listings]);

  const feedCards = useMemo(() => {
    if (feedTab === 'hot') {
      return [...cards].sort((a, b) => b.hotness - a.hotness).slice(0, 6);
    }
    if (feedTab === 'graduating') {
      return [...cards].sort((a, b) => b.curveProgress - a.curveProgress).slice(0, 6);
    }
    return cards.slice(0, 6);
  }, [cards, feedTab]);

  const liveTape = useMemo(() => {
    return cards.slice(0, 8).map((card, index) => ({
      id: `${card.id}-${index}`,
      title: index % 2 === 0 ? 'New buy' : 'Launch activity',
      detail: `${card.name} · ${index % 2 === 0 ? card.price : card.volume}`,
      meta: index % 2 === 0 ? `${card.traders} traders` : `${card.curveProgress}% to graduation`,
    }));
  }, [cards]);

  const headlineSummary = stats
    ? `${stats.activeListings.toLocaleString()} active listings · ${stats.activeAuctions.toLocaleString()} auctions · ${stats.totalSales.toLocaleString()} total sales`
    : loading
      ? 'Loading marketplace snapshot...'
      : 'Marketplace snapshot unavailable right now';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_35%),radial-gradient(circle_at_right,_rgba(168,85,247,0.10),_transparent_25%)]">
      <section className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <div className="grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              ARC home shell
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Open ARC from the route that matters, then keep the next move obvious.
            </h1>
            <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              The homepage now acts as a connected entry point for launch, discovery, stats, and trader follow-through, while still keeping the freshest markets front and center.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/launch"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <Rocket className="h-4 w-4" />
                Launch a token
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                Explore marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/stats"
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
              >
                <BarChart3 className="h-4 w-4" />
                View stats
              </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-sm text-neutral-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300">
              {headlineSummary}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {HERO_KPIS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
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

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-white/10 dark:bg-slate-950/60">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Market pulse</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                <Radio className="h-3.5 w-3.5" />
                Live
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PulseCard
                label="24h volume"
                value={stats ? formatCompactUSDC(stats.dailyVolume) : loading ? 'Loading...' : '—'}
                hint="Marketplace velocity"
              />
              <PulseCard
                label="Total volume"
                value={stats ? formatCompactUSDC(stats.totalVolume) : loading ? 'Loading...' : '—'}
                hint="Cumulative across ARC"
              />
              <PulseCard
                label="Active listings"
                value={stats ? stats.activeListings.toLocaleString() : loading ? 'Loading...' : '—'}
                hint="Sell-side inventory"
              />
              <PulseCard
                label="Active auctions"
                value={stats ? stats.activeAuctions.toLocaleString() : loading ? 'Loading...' : '—'}
                hint="Discovery depth"
              />
              <PulseCard
                label="Sales today"
                value={stats ? stats.dailySales.toLocaleString() : loading ? 'Loading...' : '—'}
                hint="Completed activity"
              />
              <PulseCard
                label="Total sales"
                value={stats ? stats.totalSales.toLocaleString() : loading ? 'Loading...' : '—'}
                hint="Historical throughput"
              />
            </div>
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Homepage role</span>
                <span className="font-semibold text-neutral-900 dark:text-white">Connected shell</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
              </div>
              <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                This surface now points users into launch, discovery, stats, rewards, and live token markets instead of acting like an isolated hero page.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
                <Sparkles className="h-4 w-4" />
                Phase 1 continuity
              </div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                Home now behaves like the ARC starting surface for both creators and traders.
              </div>
              <p className="mt-1 max-w-3xl text-sm text-blue-800 dark:text-blue-200">
                Discovery remains central, but the route also keeps macro stats and next-step navigation close enough to support real flow instead of forcing users back through disconnected pages.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-white/70 px-4 py-3 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-slate-950/40 dark:text-blue-200">
              <div className="font-semibold">Connected surfaces</div>
              <div className="mt-1">{CONNECTED_SURFACES.length} primary routes anchored from home</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Launch feed</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Switch between fresh launches, momentum, and near-graduation markets.
                  </p>
                </div>
                <div className="flex gap-2">
                  {(['new', 'hot', 'graduating'] as FeedTab[]).map((tab) => (
                    <button
                      key={tab}
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

              <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">{FEED_LABELS[feedTab].title}</div>
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{FEED_LABELS[feedTab].subtitle}</div>
              </div>

              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-48 rounded-3xl border border-neutral-200 bg-neutral-100/80 dark:border-white/10 dark:bg-slate-950/60"
                    />
                  ))}
                </div>
              ) : feedCards.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {feedCards.map((card) => (
                    <Link
                      key={card.id}
                      href={card.href}
                      className="group rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/60 dark:hover:border-blue-500/40"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                            {card.badge}
                          </div>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{card.name}</h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">{card.collection}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold text-white">
                          {card.name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <FeedMetric icon={<Wallet className="h-4 w-4" />} label="Price" value={card.price} />
                        <FeedMetric icon={<TrendingUp className="h-4 w-4" />} label="Volume" value={card.volume} />
                        <FeedMetric icon={<Users className="h-4 w-4" />} label="Traders" value={String(card.traders)} />
                        <FeedMetric icon={<LineChart className="h-4 w-4" />} label="Base" value={card.basePrice} />
                      </div>

                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          <span>Curve progress</span>
                          <span>{card.curveProgress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
                            style={{ width: `${card.curveProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-neutral-500 dark:text-neutral-400">Launched {card.age}</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                          Open market
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-center text-neutral-500 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-400">
                  No live feed data yet.
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FeaturePanel
                icon={<Rocket className="h-5 w-5" />}
                title="Launchpad"
                description="Start with the guided launch flow, creator trust links, and curve presets that now connect cleanly into the broader ARC journey."
                href="/launch"
                cta="Open launch flow"
              />
              <FeaturePanel
                icon={<Layers3 className="h-5 w-5" />}
                title="Marketplace"
                description="Browse discovery surfaces and hand off directly into live token routes without leaving the shell mindset introduced in the last phase."
                href="/explore"
                cta="Open marketplace"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Connected routes</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    The next best ARC surface should always be obvious from home.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Shell aware
                </span>
              </div>

              <div className="space-y-3">
                {CONNECTED_SURFACES.map((route) => {
                  const Icon = route.icon;
                  return (
                    <Link
                      key={route.title}
                      href={route.href}
                      className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-blue-300 hover:bg-white dark:border-white/10 dark:bg-slate-950/60 dark:hover:border-blue-500/40"
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="font-semibold text-neutral-900 dark:text-white">{route.title}</div>
                      <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{route.description}</div>
                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {route.cta}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Live tape</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    A compact stream of momentum cues for traders scanning the top of the funnel.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
                  <Flame className="h-3.5 w-3.5" />
                  Active
                </span>
              </div>

              <div className="space-y-3">
                {liveTape.length > 0 ? (
                  liveTape.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-neutral-900 dark:text-white">{item.title}</div>
                          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{item.detail}</div>
                        </div>
                        <div className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                          {item.meta}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-400">
                    Waiting for feed data.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">Readiness view</h2>
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
          </div>
        </div>
      </section>
    </div>
  );
}

function PulseCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{hint}</div>
    </div>
  );
}

function FeedMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

function FeaturePanel({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/70 dark:hover:border-blue-500/40"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
        {cta}
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function ReadinessRow({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
          {icon}
        </div>
        <div>
          <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{detail}</div>
        </div>
      </div>
    </div>
  );
}
