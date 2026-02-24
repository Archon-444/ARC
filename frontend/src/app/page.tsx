'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame, LineChart, RadioTower, Rocket, Star, TrendingUp, Percent } from 'lucide-react';
import { fetchListings, fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatCompactUSDC, formatUSDC } from '@/lib/utils';
import { Badge, Button, Card } from '@/components/ui';
import type { Listing } from '@/types';

interface MarketplaceStats {
  totalVolume: string;
  dailyVolume: string;
  totalSales: number;
  dailySales: number;
  activeListings: number;
  activeAuctions: number;
}

const HERO_SLIDES = [
  {
    title: 'Arc Originals: Aurora Phase II',
    description: 'Immersive 3D sculptures minted exclusively on Arc with dynamic lighting layers.',
    cta: '/collections/arc-originals',
    stats: 'Mint live · 2,000 supply',
  },
  {
    title: 'Creator Accelerator Cohort',
    description: 'Ten rising studios debut interactive drops with XP boosters and transparent royalties.',
    cta: '/explore?filter=accelerator',
    stats: 'XP Boost · Verified creators',
  },
  {
    title: 'Realtime Arc Gaming Market',
    description: 'Track esports collectibles across leagues with AI-powered recommendations.',
    cta: '/explore?category=gaming',
    stats: 'Live auctions · Trending now',
  },
];

const CATEGORY_DATA = [
  { label: 'Art', icon: '🎨', href: '/explore?category=art' },
  { label: 'Gaming', icon: '🎮', href: '/explore?category=gaming' },
  { label: 'Music', icon: '🎵', href: '/explore?category=music' },
  { label: 'Photography', icon: '📷', href: '/explore?category=photography' },
  { label: 'Sports', icon: '🏅', href: '/explore?category=sports' },
  { label: 'Utility', icon: '🛠️', href: '/explore?category=utility' },
  { label: 'AI', icon: '🤖', href: '/explore?category=ai' },
  { label: 'Fashion', icon: '👗', href: '/explore?category=fashion' },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activityFilter, setActivityFilter] = useState<'all' | 'sales' | 'listings'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const listingsData = await fetchListings({
        first: 24,
        skip: 0,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });
      const statsData = await fetchMarketplaceStats();
      setListings(listingsData || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load home page data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const trendingCollections = useMemo(() => {
    const grouped = new Map<string, { volume: bigint; floor: bigint; sample?: Listing }>();
    listings.forEach((listing) => {
      const key = listing.nft?.collection?.id ?? listing.collection;
      if (!grouped.has(key)) {
        grouped.set(key, {
          volume: BigInt(listing.price),
          floor: BigInt(listing.price),
          sample: listing,
        });
      } else {
        const current = grouped.get(key)!;
        grouped.set(key, {
          volume: current.volume + BigInt(listing.price),
          floor: current.floor < BigInt(listing.price) ? current.floor : BigInt(listing.price),
          sample: current.sample,
        });
      }
    });
    return Array.from(grouped.values()).slice(0, 6);
  }, [listings]);

  const notableDrops = useMemo(() => listings.slice(0, 8), [listings]);

  const liveActivity = useMemo(() => {
    return listings.slice(0, 12).map((item, index) => ({
      type: index % 2 === 0 ? 'sale' : 'listing',
      label: index % 2 === 0 ? 'Sale completed' : 'New listing',
      name: item.nft?.name || `Token #${item.tokenId}`,
      price: formatUSDC(BigInt(item.price)),
      timestamp: new Date(Number(item.createdAt) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [listings]);

  const filteredActivity = liveActivity.filter((event) => activityFilter === 'all' || event.type === activityFilter.slice(0, -1));

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 py-20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950">
        <div className="container-custom grid gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="primary" size="lg" className="mb-6 inline-flex items-center gap-2">
              <Star className="h-4 w-4" />
              Zero-Friction NFT Trading
            </Badge>
            <div className="space-y-6">
              <div className="glass-panel p-6">
                <p className="text-sm uppercase tracking-wide text-neutral-500">Featured drop</p>
                <h1 className="mt-2 text-4xl font-bold text-neutral-900 dark:text-white">
                  {HERO_SLIDES[activeSlide].title}
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
                  {HERO_SLIDES[activeSlide].description}
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Button asChild className="btn-primary">
                    <Link href={HERO_SLIDES[activeSlide].cta}>
                      Explore drop
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild className="btn-outline">
                    <Link href="/studio">Create on Arc</Link>
                  </Button>
                </div>
                <div className="mt-6 flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-300">
                  <RadioTower className="h-4 w-4" />
                  {HERO_SLIDES[activeSlide].stats}
                </div>
              </div>
            </div>
          </div>

          <div className="relative rounded-[32px] border border-white/30 bg-white/50 p-6 shadow-2xl backdrop-blur-xl dark:bg-white/5">
            <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-200">Live Stats</p>
            <div className="mt-6 grid grid-cols-2 gap-6">
              {stats ? (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Total Volume</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                      {formatCompactUSDC(stats.totalVolume)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Daily Volume</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                      {formatCompactUSDC(stats.dailyVolume)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Active Listings</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                      {stats.activeListings.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Live Auctions</p>
                    <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-white">
                      {stats.activeAuctions.toLocaleString()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 space-y-4">
                  <div className="skeleton h-16 w-full" />
                  <div className="skeleton h-16 w-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-custom space-y-12 py-16">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-error-700 dark:bg-error-900/20 dark:text-error-200">
            {error}
          </div>
        )}

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-12">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Trending Collections</h2>
                <Link href="/explore" className="chip">
                  View all
                </Link>
              </div>
              <div className="scroll-shadow-x flex gap-4 overflow-x-auto pb-4">
                {trendingCollections.map((entry, index) => (
                  <Card key={index} className="min-w-[240px] card-hover">
                    <p className="text-sm text-neutral-500">Floor</p>
                    <p className="text-xl font-bold">{formatUSDC(entry.floor)}</p>
                    <p className="mt-2 text-sm text-neutral-400">
                      24h Volume {formatUSDC(entry.volume)}
                    </p>
                  </Card>
                ))}
                {loading && (
                  <div className="flex gap-4">
                    <div className="skeleton h-40 w-60" />
                    <div className="skeleton h-40 w-60" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Notable Drops</h2>
                <Badge variant="primary" size="sm" icon={<Flame className="h-3 w-3" />}>Live now</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {notableDrops.map((listing) => (
                  <Card key={listing.id} className="card-hover">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-neutral-500">
                          {listing.nft?.collection?.name ?? 'Collection'}
                        </p>
                        <p className="text-lg font-semibold">{listing.nft?.name ?? `Token #${listing.tokenId}`}</p>
                      </div>
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-600 dark:bg-primary-500/20 dark:text-primary-300">
                        {formatUSDC(BigInt(listing.price))}
                      </span>
                    </div>
                  </Card>
                ))}
                {loading && <div className="skeleton h-32 w-full" />}
              </div>
            </div>

            {/* Token Launchpad Section */}
            <div className="glass-panel grid gap-6 p-6 lg:grid-cols-2">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700 dark:bg-accent-500/20 dark:text-accent-300">
                  <Rocket className="h-3.5 w-3.5" />
                  Token Launchpad
                </div>
                <h3 className="text-2xl font-bold">Launch a Token on Arc</h3>
                <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                  Deploy your own ERC-20 token with a bonding curve in minutes. Price rises algorithmically as supply sells. When 80% is purchased, your token graduates and unlocks creator treasury + staking rewards.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild className="btn-primary">
                    <Link href="/launch">
                      Launch a Token
                      <Rocket className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild className="btn-outline">
                    <Link href="/explore?tab=tokens">Browse Tokens</Link>
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100 dark:bg-accent-500/20">
                      <TrendingUp className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Bonding Curve Pricing</p>
                      <p className="text-xs text-neutral-500">Price rises automatically as more tokens sell</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-500/20">
                      <Star className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Graduate at 80%</p>
                      <p className="text-xs text-neutral-500">Creator treasury + staking rewards unlock</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                      <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Staker Discount</p>
                      <p className="text-xs text-neutral-500">Up to 50% off creation fee for ARC stakers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-2xl font-bold">Browse by Category</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {CATEGORY_DATA.map((category) => (
                  <Link key={category.label} href={category.href} className="card card-hover flex flex-col items-start gap-2 p-4">
                    <span className="text-2xl">{category.icon}</span>
                    <p className="text-sm font-semibold">{category.label}</p>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Curated picks</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="glass-panel h-fit p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-neutral-500">Live Activity</p>
                <h3 className="text-xl font-semibold">Real-time trades</h3>
              </div>
              <LineChart className="h-5 w-5 text-primary-500" />
            </div>
            <div className="mt-4 flex gap-2">
              {(['all', 'sales', 'listings'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`chip ${activityFilter === filter ? 'border-primary-500 text-primary-600 dark:text-primary-400' : ''}`}
                >
                  {filter === 'all' ? 'All' : filter === 'sales' ? 'Sales' : 'Listings'}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-4">
              {filteredActivity.map((event, index) => (
                <div key={`${event.name}-${index}`} className="rounded-2xl border border-neutral-100/60 p-3 dark:border-neutral-800">
                  <p className="text-sm font-semibold">{event.label}</p>
                  <p className="text-sm text-neutral-500">{event.name}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>{event.timestamp}</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">{event.price}</span>
                  </div>
                </div>
              ))}
              {filteredActivity.length === 0 && <div className="skeleton h-32 w-full" />}
            </div>
          </aside>
        </section>

      </div>
    </div>
  );
}
