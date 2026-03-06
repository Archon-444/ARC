/**
 * Explore Page
 *
 * Upgraded discovery surface for NFTs, auctions, and launched tokens.
 */

'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Clock3,
  Flame,
  Gavel,
  Package,
  Radio,
  Rocket,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { NFTGrid } from '@/components/nft/NFTCard';
import { TokenGrid } from '@/components/token/TokenCard';
import { useAllTokens } from '@/hooks/useTokenFactory';
import { StatCard } from '@/components/ui/StatCard';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay, EmptyState } from '@/components/ui/ErrorDisplay';
import { fetchListings, fetchAuctions, fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatCompactUSDC, formatNumber, debounce, formatUSDC } from '@/lib/utils';
import type { NFT, Listing, Auction, MarketplaceStats, SortOption } from '@/types';

type ViewMode = 'all' | 'listings' | 'auctions' | 'tokens';

const ITEMS_PER_PAGE = 20;

const SORT_OPTIONS: SortOption[] = [
  { label: 'Recently Listed', value: 'recent', orderBy: 'createdAt', orderDirection: 'desc' },
  { label: 'Price: Low to High', value: 'price_asc', orderBy: 'price', orderDirection: 'asc' },
  { label: 'Price: High to Low', value: 'price_desc', orderBy: 'price', orderDirection: 'desc' },
  { label: 'Ending Soon', value: 'ending', orderBy: 'endTime', orderDirection: 'asc' },
];

export default function ExplorePage() {
  return (
    <Suspense fallback={<LoadingPage label="Loading Explore..." />}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as ViewMode | null;

  const [viewMode, setViewMode] = useState<ViewMode>(
    initialTab && ['all', 'listings', 'auctions', 'tokens'].includes(initialTab) ? initialTab : 'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { tokens: launchedTokens, isLoading: tokensLoading } = useAllTokens();

  useEffect(() => {
    const tab = searchParams.get('tab') as ViewMode | null;
    if (tab && ['all', 'listings', 'auctions', 'tokens'].includes(tab)) {
      setViewMode(tab);
    }
  }, [searchParams]);

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadData();
  }, [viewMode, currentPage, sortBy, debouncedSearch]);

  const loadStats = async () => {
    try {
      const statsData = await fetchMarketplaceStats();
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;

      if (viewMode === 'all' || viewMode === 'listings') {
        const listingsData = await fetchListings({
          first: ITEMS_PER_PAGE,
          skip,
          orderBy: sortBy.orderBy,
          orderDirection: sortBy.orderDirection,
        });
        setListings(listingsData);
      }

      if (viewMode === 'all' || viewMode === 'auctions') {
        const auctionsData = await fetchAuctions({
          first: ITEMS_PER_PAGE,
          skip,
        });
        setAuctions(auctionsData);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const allNFTs: NFT[] = [
    ...(listings.map((listing) => listing.nft).filter(Boolean) as NFT[]),
    ...(auctions.map((auction) => auction.nft).filter(Boolean) as NFT[]),
  ];

  const displayNFTs = (() => {
    if (viewMode === 'listings') return listings.map((listing) => listing.nft).filter(Boolean) as NFT[];
    if (viewMode === 'auctions') return auctions.map((auction) => auction.nft).filter(Boolean) as NFT[];
    return allNFTs;
  })();

  const filteredNFTs = displayNFTs.filter((nft) => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return (
      nft.name?.toLowerCase().includes(query) ||
      nft.collection?.name?.toLowerCase().includes(query) ||
      nft.tokenId?.toString().includes(query) ||
      nft.owner?.toLowerCase().includes(query)
    );
  });

  const listingsMap: Record<string, Listing> = {};
  listings.forEach((listing) => {
    if (listing.nft) {
      listingsMap[`${listing.collection.toLowerCase()}-${listing.tokenId}`] = listing;
    }
  });

  const auctionsMap: Record<string, Auction> = {};
  auctions.forEach((auction) => {
    if (auction.nft) {
      auctionsMap[`${auction.collection.toLowerCase()}-${auction.tokenId}`] = auction;
    }
  });

  const totalPages = Math.ceil((filteredNFTs.length || ITEMS_PER_PAGE) / ITEMS_PER_PAGE);

  const activityRows = useMemo(() => {
    return listings.slice(0, 6).map((listing, index) => ({
      id: listing.id,
      name: listing.nft?.name || `Token #${listing.tokenId}`,
      price: formatUSDC(BigInt(listing.price)),
      status: index % 2 === 0 ? 'Fresh listing' : 'Hot watch',
    }));
  }, [listings]);

  if (isLoading && !listings.length && !auctions.length && viewMode !== 'tokens') {
    return <LoadingPage label="Loading NFTs..." />;
  }

  if (error && !listings.length && !auctions.length && viewMode !== 'tokens') {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay error={error} title="Failed to load marketplace" onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 lg:py-10">
      <div className="mb-8 grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            ARC discovery hub
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
            Explore marketplace inventory and live token markets in one place.
          </h1>
          <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
            ARC now brings listings, auctions, and launched tokens into a single discovery layer so users can move from browsing to trading without friction.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/launch" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
              <Rocket className="h-4 w-4" />
              Launch a token
            </Link>
            <Link href="/stats" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
              Open stats
              <ArrowRight className="h-4 w-4" />
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
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Volume" value={formatCompactUSDC(stats.totalVolume)} icon={TrendingUp} />
              <StatCard label="Total Sales" value={formatNumber(stats.totalSales)} icon={Package} />
              <StatCard label="Active Listings" value={formatNumber(stats.activeListings)} />
              <StatCard label="Active Auctions" value={formatNumber(stats.activeAuctions)} />
            </div>
          )}
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">Launched token markets</div>
            <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
              {tokensLoading ? 'Loading...' : launchedTokens.length.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Token discovery is now treated as a first-class part of the marketplace flow.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Discovery controls</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Search, sort, and switch across listings, auctions, and launched tokens.</p>
              </div>
              <div className="flex gap-3">
                <select
                  value={sortBy.value}
                  onChange={(e) => {
                    const option = SORT_OPTIONS.find((opt) => opt.value === e.target.value);
                    if (option) setSortBy(option);
                  }}
                  className="rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {showFilters ? 'Hide filters' : 'Filters'}
                </button>
              </div>
            </div>

            <div className="relative mb-4 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, collection, token ID, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 bg-white py-3 pl-12 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto whitespace-nowrap pb-2">
              <ModePill active={viewMode === 'all'} onClick={() => { setViewMode('all'); setCurrentPage(1); }} label="All" count={allNFTs.length} />
              <ModePill active={viewMode === 'listings'} onClick={() => { setViewMode('listings'); setCurrentPage(1); }} label="Listings" count={listings.length} />
              <ModePill active={viewMode === 'auctions'} onClick={() => { setViewMode('auctions'); setCurrentPage(1); }} label="Auctions" count={auctions.length} />
              <ModePill active={viewMode === 'tokens'} onClick={() => { setViewMode('tokens'); setCurrentPage(1); }} label="Tokens" count={launchedTokens.length} />
            </div>

            {showFilters && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-400">
                Additional collection, price band, and creator reputation filters can plug into this panel next.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {viewMode === 'tokens' ? 'Launched token markets' : 'Marketplace inventory'}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {viewMode === 'tokens'
                    ? 'Launched tokens now sit inside the same discovery system as NFT inventory.'
                    : 'A cleaner browsing surface for listings and auctions with stronger navigation context.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                <Flame className="h-3.5 w-3.5" />
                {viewMode === 'tokens' ? 'Launchpad mode' : 'Marketplace mode'}
              </span>
            </div>

            {viewMode === 'tokens' ? (
              <TokenGrid tokens={launchedTokens} isLoading={tokensLoading} />
            ) : filteredNFTs.length === 0 && !isLoading ? (
              <EmptyState
                title="Nothing found"
                description={debouncedSearch ? 'Try a broader query or switch tabs.' : 'No inventory is available for this view right now.'}
              />
            ) : (
              <>
                <NFTGrid nfts={filteredNFTs} listings={listingsMap} auctions={auctionsMap} isLoading={isLoading} />
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Live activity</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
                <Radio className="h-3.5 w-3.5" />
                Streaming
              </span>
            </div>
            <div className="space-y-3">
              {activityRows.length > 0 ? (
                activityRows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-white">{row.name}</div>
                        <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{row.status}</div>
                      </div>
                      <div className="font-semibold text-neutral-900 dark:text-white">{row.price}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-400">
                  Activity will populate as market data loads.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">Quick routes</h2>
            <div className="space-y-3">
              <ShortcutCard icon={<Rocket className="h-4 w-4" />} title="Launch flow" description="Create with the new guided token launch page." href="/launch" />
              <ShortcutCard icon={<Wallet className="h-4 w-4" />} title="Token markets" description="Open the upgraded trader-facing token detail pages." href="/token/demo-market" />
              <ShortcutCard icon={<TrendingUp className="h-4 w-4" />} title="Analytics" description="Review the stats surface for momentum and volume signals." href="/stats" />
              <ShortcutCard icon={<Gavel className="h-4 w-4" />} title="Auction mode" description="Switch into active auction inventory instantly." href="/explore?tab=auctions" />
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">Build queue</h2>
            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <QueueRow icon={<Clock3 className="h-4 w-4" />} title="Plug real launch entities into token-market routes" />
              <QueueRow icon={<TrendingUp className="h-4 w-4" />} title="Connect live volume, price, and curve status into the new cards" />
              <QueueRow icon={<Rocket className="h-4 w-4" />} title="Route launch success directly to the created token page" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ModePill({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={active
        ? 'rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black'
        : 'rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300 dark:hover:text-white'}
    >
      {label}
      {count !== undefined && <span className="ml-2 text-xs opacity-70">{count}</span>}
    </button>
  );
}

function ShortcutCard({ icon, title, description, href }: { icon: ReactNode; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-blue-300 hover:bg-white dark:border-white/10 dark:bg-slate-950/60 dark:hover:border-blue-500/40">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
    </Link>
  );
}

function QueueRow({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-300">{icon}</div>
      <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
    </div>
  );
}
