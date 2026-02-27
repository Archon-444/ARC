'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  Bot,
  Camera,
  Diamond,
  Flame,
  Gamepad2,
  ImageIcon,
  Music2,
  Palette,
  Rocket,
  Shirt,
  Star,
  Store,
  TrendingUp,
  Wrench,
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

const HERO_SLIDES = [
  {
    titleLine1: 'Arc Originals:',
    titleLine2: 'Aurora Phase II',
    description: 'Immersive 3D sculptures minted exclusively on Arc with dynamic lighting layers.',
    cta: '/collections/arc-originals',
    stats: 'Mint live · 2,000 supply',
  },
  {
    titleLine1: 'Creator Accelerator',
    titleLine2: 'Cohort Drop',
    description: 'Ten rising studios debut interactive drops with XP boosters and transparent royalties.',
    cta: '/explore?filter=accelerator',
    stats: 'XP Boost · Verified creators',
  },
  {
    titleLine1: 'Realtime Arc',
    titleLine2: 'Gaming Market',
    description: 'Track esports collectibles across leagues with AI-powered recommendations.',
    cta: '/explore?category=gaming',
    stats: 'Live auctions · Trending now',
  },
];

const CATEGORY_DATA = [
  { label: 'Art', icon: '🎨', iconBg: 'bg-orange-500/10 hover:bg-orange-500/20', href: '/explore?category=art', sub: 'Curated picks' },
  { label: 'Gaming', lucide: Gamepad2, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10 hover:bg-purple-500/20', href: '/explore?category=gaming', sub: 'Metaverse assets' },
  { label: 'Music', lucide: Music2, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/10 hover:bg-blue-500/20', href: '/explore?category=music', sub: 'Audio NFTs' },
  { label: 'Photography', lucide: Camera, iconColor: 'text-pink-400', iconBg: 'bg-pink-500/10 hover:bg-pink-500/20', href: '/explore?category=photography', sub: 'Fine art photo' },
  { label: 'Sports', icon: '🏆', iconBg: 'bg-yellow-500/10 hover:bg-yellow-500/20', href: '/explore?category=sports', sub: 'Collectibles' },
  { label: 'Utility', lucide: Wrench, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/10 hover:bg-cyan-500/20', href: '/explore?category=utility', sub: 'Passes & Access' },
  { label: 'AI', lucide: Bot, iconColor: 'text-red-400', iconBg: 'bg-red-500/10 hover:bg-red-500/20', href: '/explore?category=ai', sub: 'Generative' },
  { label: 'Fashion', lucide: Shirt, iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/10 hover:bg-indigo-500/20', href: '/explore?category=fashion', sub: 'Wearables' },
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

  const currentSlide = HERO_SLIDES[activeSlide];

  return (
    <div className="min-h-screen">
      {/* ======================== HERO SECTION ======================== */}
      <section className="relative overflow-hidden py-20">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 8 cols — Featured Drop */}
          <div className="lg:col-span-8 relative overflow-hidden rounded-3xl bg-surface-dark border border-gray-800 shadow-2xl group min-h-[400px]">
            {/* Decorative blur circles */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-secondary-500/20 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />

            <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center h-full">
              {/* Featured Drop badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 w-fit mb-6">
                <Star className="h-3 w-3 text-yellow-400" />
                <span className="text-xs font-semibold tracking-wide uppercase text-white/90">Featured Drop</span>
              </div>

              {/* Title with gradient animated text */}
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                {currentSlide.titleLine1}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary-400 to-purple-400">
                  {currentSlide.titleLine2}
                </span>
              </h1>

              <p className="text-gray-400 text-lg max-w-lg mb-8">
                {currentSlide.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href={currentSlide.cta}
                  className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-lg shadow-primary-500/30 flex items-center gap-2 transition-all"
                >
                  Explore drop <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/launch"
                  className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-500/30 flex items-center gap-2 transition-all"
                >
                  <Rocket className="h-4 w-4" /> Launch a Token
                </Link>
              </div>

              {/* Live indicator */}
              <div className="mt-8 flex items-center gap-3 text-sm font-medium text-gray-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                {currentSlide.stats}
              </div>
            </div>

            {/* Slide indicators */}
            <div className="absolute bottom-4 right-6 flex gap-2">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activeSlide ? 'bg-primary-400 w-6' : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right 4 cols — Live Stats */}
          <div className="lg:col-span-4">
            <div className="bg-surface-dark border border-gray-800 rounded-3xl p-6 h-full shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                Live Stats
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wide font-semibold">Real-time</span>
              </h3>

              {/* Recent sale items */}
              <div className="space-y-3">
                {[
                  { name: 'Cyber Punk #882', label: 'Just sold', price: '4.2 ETH', sub: '$12,402', subColor: 'text-gray-500' },
                  { name: 'Ape Club #102', label: 'New offer', price: '12.5 ETH', sub: '+5% floor', subColor: 'text-green-400' },
                ].map((item) => (
                  <div key={item.name} className="group/item p-4 rounded-2xl bg-background-dark/50 border border-gray-700/50 hover:border-gray-600 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.label}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white text-sm">{item.price}</p>
                        <p className={`text-xs ${item.subColor}`}>{item.sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Volume mini-chart */}
              <div className="relative h-32 w-full mt-4 bg-gradient-to-b from-transparent to-primary-500/5 rounded-xl border border-gray-800 overflow-hidden">
                <svg className="absolute bottom-0 w-full h-full text-primary-500 opacity-30" preserveAspectRatio="none" viewBox="0 0 100 50">
                  <path d="M0 40 Q 20 20 40 30 T 100 10 V 50 H 0 Z" fill="currentColor" />
                  <path d="M0 40 Q 20 20 40 30 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div className="absolute top-2 left-4 text-xs font-mono text-gray-500">Volume (24h)</div>
                <div className="absolute bottom-2 right-4 text-xl font-bold text-white">
                  {stats ? formatCompactUSDC(stats.dailyVolume) : '—'}
                </div>
              </div>

              {/* Stats grid */}
              {stats && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-background-dark/50 border border-gray-800">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Listings</p>
                    <p className="text-lg font-bold text-white">{stats.activeListings.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background-dark/50 border border-gray-800">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Auctions</p>
                    <p className="text-lg font-bold text-white">{stats.activeAuctions.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== MAIN CONTENT ======================== */}
      <div className="container-custom space-y-12 py-16">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {/* ======================== PRODUCT CARDS ======================== */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* NFT Marketplace */}
          <div className="relative group rounded-3xl p-8 overflow-hidden bg-[#0f3460]/80 backdrop-blur-lg border border-blue-500/20 hover:border-blue-400/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Store size={160} />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-3">NFT Marketplace</h2>
              <p className="text-blue-100/80 mb-8 max-w-sm text-lg">
                Trade unique digital assets, explore curated collections, and bid on live auctions.
              </p>
              <Link href="/explore" className="inline-flex items-center gap-2 font-semibold text-white hover:text-blue-200 transition-colors">
                Explore Collections <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Token Launchpad */}
          <div className="relative group rounded-3xl p-8 overflow-hidden bg-[#2e1065]/80 backdrop-blur-lg border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Rocket size={160} />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-3">Token Launchpad</h2>
              <p className="text-purple-100/80 mb-8 max-w-md text-lg">
                Launch an ERC-20 token with a bonding curve. Graduate at 80% to unlock creator treasury.
              </p>
              <Link href="/launch" className="inline-flex items-center gap-2 font-semibold text-white hover:text-purple-200 transition-colors">
                Launch a Token <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ======================== NOTABLE DROPS + LIVE ACTIVITY ======================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Notable Drops (8 cols) */}
          <div className="lg:col-span-8 space-y-12">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Notable Drops</h2>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                  <Flame className="h-3 w-3" /> Live now
                </span>
              </div>

              {notableDrops.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {notableDrops.slice(0, 4).map((listing, i) => (
                    <div key={listing.id} className="group relative rounded-2xl bg-surface-dark border border-gray-800 overflow-hidden hover:border-primary-500/50 transition-all duration-300">
                      <div className="h-48 bg-gray-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          {i % 2 === 0
                            ? <Diamond className="h-16 w-16 text-gray-600 group-hover:scale-110 transition-transform duration-500" />
                            : <Palette className="h-16 w-16 text-gray-600 group-hover:scale-110 transition-transform duration-500" />
                          }
                        </div>
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-white">
                          {formatUSDC(BigInt(listing.price))}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                          {listing.nft?.name ?? `Token #${listing.tokenId}`}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                          {listing.nft?.collection?.name ?? 'Collection'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Live now</span>
                          <button className="px-4 py-1.5 rounded-lg bg-gray-700 hover:bg-white hover:text-black text-white text-sm font-medium transition-colors">
                            Bid
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[0, 1].map((i) => (
                    <div key={i} className="rounded-2xl bg-surface-dark border border-gray-800 overflow-hidden">
                      <div className="h-48 skeleton" />
                      <div className="p-5 space-y-3">
                        <div className="skeleton h-5 w-3/4" />
                        <div className="skeleton h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-800 bg-surface-dark p-8 text-center">
                  <p className="text-gray-500">No active listings yet. Check back soon!</p>
                </div>
              )}
            </div>

            {/* ======================== CATEGORIES ======================== */}
            <div>
              <h2 className="mb-6 text-2xl font-bold dark:text-white">Browse by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CATEGORY_DATA.map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    className="group p-4 bg-surface-dark border border-gray-800 rounded-2xl hover:border-primary-500/50 hover:bg-gray-800 transition-all card-hover"
                  >
                    <div className={`w-10 h-10 rounded-lg ${cat.iconBg} flex items-center justify-center mb-3 transition-colors`}>
                      {cat.icon
                        ? <span className="text-xl">{cat.icon}</span>
                        : cat.lucide && <cat.lucide className={`h-5 w-5 ${cat.iconColor}`} />
                      }
                    </div>
                    <p className="font-bold text-white mb-1">{cat.label}</p>
                    <p className="text-xs text-gray-500">{cat.sub}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Live Activity (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-surface-dark rounded-3xl p-6 border border-gray-800 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Live Activity</p>
                  <h3 className="text-xl font-bold text-white">Real-time trades</h3>
                </div>
                <TrendingUp className="h-6 w-6 text-primary-500 cursor-pointer hover:bg-gray-800 rounded p-1 transition-colors" />
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2 mb-6">
                {(['all', 'sales', 'listings'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    className={activityFilter === f
                      ? 'px-3 py-1 rounded-full bg-white text-black text-xs font-bold shadow-sm'
                      : 'px-3 py-1 rounded-full bg-gray-800 text-gray-400 hover:text-white text-xs font-medium border border-gray-700 transition-colors'
                    }
                  >
                    {f === 'all' ? 'All' : f === 'sales' ? 'Sales' : 'Listings'}
                  </button>
                ))}
              </div>

              {/* Activity feed */}
              {filteredActivity.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                  {filteredActivity.map((event, index) => (
                    <div key={`${event.name}-${index}`} className="p-3 rounded-xl bg-background-dark/50 border border-gray-700/50 hover:border-gray-600 transition-all">
                      <p className="text-sm font-semibold text-white">{event.label}</p>
                      <p className="text-sm text-gray-400">{event.name}</p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-500">{event.timestamp}</span>
                        <span className="font-semibold text-primary-400">{event.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-background-dark/50 rounded-xl border border-gray-800 p-4 h-64 flex flex-col justify-center items-center text-center">
                  <BarChart2 className="h-10 w-10 text-gray-700 mb-2" />
                  <p className="text-gray-500 text-sm">Activity feed visualization loading...</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
