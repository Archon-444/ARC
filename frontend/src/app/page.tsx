'use client';

import { useEffect, useMemo, useState } from 'react';
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
    label: 'Fast launch flow',
    value: 'Launch to live market',
    hint: 'Creator setup, token page, and trading context in one journey.',
    icon: Rocket,
  },
  {
    label: 'Discovery loop',
    value: 'Feed-first homepage',
    hint: 'New, hot, and near-graduation views keep traders moving.',
    icon: Radio,
  },
  {
    label: 'Trust layer',
    value: 'Creator context',
    hint: 'Social proof and market stats reduce hesitation.',
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

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>('new');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
  };

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_35%),radial-gradient(circle_at_right,_rgba(168,85,247,0.10),_transparent_25%)]">
      <section className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
        <div className="grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              ARC launch feed
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Build the fastest path from launch to liquidity.
            </h1>
            <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Discover newly launched markets, watch bonding curves heat up, and move straight from the feed into trading pages built for conviction.
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
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {HERO_KPIS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 dark:border-white/10 dark:bg-slate-950/60">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{item.label}</div>
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
              <PulseCard label="24h volume" value={stats ? formatCompactUSDC(stats.dailyVolume) : loading ? 'Loading...' : '—'} hint="Marketplace velocity" />
              <PulseCard label="Total volume" value={stats ? formatCompactUSDC(stats.totalVolume) : loading ? 'Loading...' : '—'} hint="Cumulative across ARC" />
              <PulseCard label="Active listings" value={stats ? stats.activeListings.toLocaleString() : loading ? 'Loading...' : '—'} hint="Sell-side inventory" />
              <PulseCard label="Sales today" value={stats ? stats.dailySales.toLocaleString() : loading ? 'Loading...' : '—'} hint="Completed activity" />
            </div>
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">Launch feed quality</span>
                <span className="font-semibold text-neutral-900 dark:text-white">Improved</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
              </div>
              <div className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                Homepage now prioritizes discovery, momentum, and direct launch-to-trade navigation.
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

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Launch feed</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Switch between fresh launches, momentum, and near-graduation markets.</p>
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
                    <div key={index} className="h-48 rounded-3xl border border-neutral-200 bg-neutral-100/80 dark:border-white/10 dark:bg-slate-950/60" />
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
                        <FeedMetric icon={<LineChart className="h-4 w-4" />} label="Comments" value={String(card.comments)} />
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
                description="Start with the new guided launch flow, creator trust links, and curve presets."
                href="/launch"
                cta="Open launch flow"
              />
              <FeaturePanel
                icon={<Layers3 className="h-5 w-5" />}
                title="Marketplace"
                description="Browse listings, collections, and the seller experience ARC is upgrading toward OpenSea-grade usability."
                href="/explore"
                cta="Open marketplace"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Live tape</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">A compact feed of momentum signals for traders.</p>
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
              <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">Build queue</h2>
              <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <QueueRow icon={<BarChart3 className="h-4 w-4" />} title="Wire feed cards to live launch and token entities" />
                <QueueRow icon={<Wallet className="h-4 w-4" />} title="Connect trade panel actions to wallet and bonding curve" />
                <QueueRow icon={<Users className="h-4 w-4" />} title="Add creator stats, comments, and follow mechanics" />
                <QueueRow icon={<Clock3 className="h-4 w-4" />} title="Route launch success directly into real token pages" />
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

function FeedMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
  icon: React.ReactNode;
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

function QueueRow({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
    </div>
  );
}
