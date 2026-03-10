'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Loader2,
  Package,
  Radio,
  Rocket,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Trophy,
  User,
  Wallet,
} from 'lucide-react';
import { NFTGrid } from '@/components/nft/NFTCard';
import { TokenGrid } from '@/components/token/TokenCard';
import { useAllTokens } from '@/hooks/useTokenFactory';
import { useExploreFilters } from '@/hooks/useExploreFilters';
import { StatCard } from '@/components/ui/StatCard';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay, EmptyState } from '@/components/ui/ErrorDisplay';
import { ModePill } from '@/components/explore/ModePill';
import { ShortcutCard } from '@/components/explore/ShortcutCard';
import { GuideRow } from '@/components/explore/GuideRow';
import { fetchListings, fetchAuctions, fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatCompactUSDC, formatNumber, formatUSDC } from '@/lib/utils';
import { ITEMS_PER_PAGE, SORT_OPTIONS, formatAddress, type ViewMode } from '@/lib/explore';
import type { NFT, Listing, Auction, MarketplaceStats } from '@/types';

export default function ExploreContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const initialTab = searchParams.get('tab') as ViewMode | null;

  const {
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    showFilters,
    setShowFilters,
  } = useExploreFilters(initialTab);

  const [listings, setListings] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { tokens: launchedTokens, isLoading: tokensLoading } = useAllTokens();

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
  const tokenMarketCount = launchedTokens.length;
  const connectedRouteCount = isConnected ? 4 : 3;

  const activityRows = useMemo(() => {
    return listings.slice(0, 6).map((listing, index) => ({
      id: listing.id,
      name: listing.nft?.name || `Token #${listing.tokenId}`,
      price: formatUSDC(BigInt(listing.price)),
      status: index % 2 === 0 ? 'Latest listing' : 'Watchlist pickup',
    }));
  }, [listings]);

  const activeViewMeta = useMemo(() => {
    if (viewMode === 'tokens') {
      return {
        title: 'Token discovery active',
        description: tokensLoading
          ? 'ARC is loading launched-token markets so users can jump from discovery into live trading.'
          : tokenMarketCount > 0
            ? 'Users are in launchpad mode now, with direct access to launched-token routes and live market entry.'
            : 'No launched-token markets are indexed yet. The launch flow is the fastest way to seed this surface.',
        tone: tokensLoading ? 'blue' : tokenMarketCount > 0 ? 'green' : 'amber',
      } as const;
    }

    if (viewMode === 'auctions') {
      return {
        title: 'Auction inventory active',
        description: 'This view narrows the ARC discovery layer to time-sensitive auction inventory.',
        tone: 'neutral',
      } as const;
    }

    if (viewMode === 'listings') {
      return {
        title: 'Listings inventory active',
        description: 'This view keeps users focused on fixed-price marketplace inventory with cleaner search and sort control.',
        tone: 'neutral',
      } as const;
    }

    return {
      title: 'Unified discovery active',
      description: 'This is the broadest ARC discovery surface, combining listings and auctions before users narrow into tokens.',
      tone: 'neutral',
    } as const;
  }, [tokenMarketCount, tokensLoading, viewMode]);

  const connectedRoutes = [
    {
      title: 'Launch flow',
      description: 'Create a new token and route it back into discovery.',
      href: '/launch',
      icon: <Rocket className="h-4 w-4" />,
    },
    {
      title: 'Stats',
      description: 'Check momentum, volume, and market context.',
      href: '/stats',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: 'Rewards',
      description: 'Follow wallet-linked progression beyond discovery.',
      href: '/rewards',
      icon: <Trophy className="h-4 w-4" />,
    },
    ...(isConnected
      ? [{
          title: 'Profile',
          description: 'Return to your connected wallet identity and creator context.',
          href: `/profile/${address}`,
          icon: <User className="h-4 w-4" />,
        }]
      : []),
  ];

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
            ARC marketplace + launchpad
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
            Explore marketplace inventory and live token markets in one place.
          </h1>
          <p className="max-w-2xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
            ARC brings listings, auctions, and launched tokens into one discovery layer so users can move from browsing to trading without friction.
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
            <Link href={isConnected && address ? `/profile/${address}` : '/profile'} className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-5 dark:border-white/10 dark:bg-slate-950/60">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Connected market pulse</h2>
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
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white">Connected wallet</div>
              <div className="mt-1 text-xl font-bold text-neutral-900 dark:text-white">{formatAddress(address)}</div>
              <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Discovery now sits closer to profile, launch, rewards, and token-market routes.
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900/80">
              <div className="text-sm font-semibold text-neutral-900 dark:text-white">Launched token markets</div>
              <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                {tokensLoading ? 'Loading...' : tokenMarketCount.toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Token discovery now sits alongside ARC marketplace inventory as a first-class experience.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:p-6">
        <div className={activeViewMeta.tone === 'green'
          ? 'rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300'
          : activeViewMeta.tone === 'blue'
            ? 'rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300'
            : activeViewMeta.tone === 'amber'
              ? 'rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200'
              : 'rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-neutral-700 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300'}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                {activeViewMeta.tone === 'green' ? <CheckCircle2 className="h-4 w-4" /> : activeViewMeta.tone === 'blue' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
                Discovery state
              </div>
              <div className="text-lg font-semibold text-neutral-900 dark:text-white">{activeViewMeta.title}</div>
              <p className="mt-1 max-w-3xl text-sm text-current">{activeViewMeta.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/explore?tab=tokens" className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black">
                <Wallet className="h-4 w-4" />
                Token mode
              </Link>
              <Link href="/launch" className="inline-flex items-center gap-2 rounded-2xl border border-current/10 bg-white/70 px-4 py-2.5 text-sm font-semibold text-current dark:bg-white/5">
                <Rocket className="h-4 w-4" />
                Launch flow
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-blue-200 bg-blue-50/80 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
              <Sparkles className="h-4 w-4" />
              Shell continuity
            </div>
            <div className="text-lg font-semibold text-neutral-900 dark:text-white">Discovery is now a connected ARC route, not a dead-end browse page.</div>
            <p className="mt-1 max-w-3xl text-sm text-blue-800 dark:text-blue-200">
              Users can move from explore into launch, stats, rewards, and profile with less context switching, while token mode stays positioned as the handoff into live market pages.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-white/70 px-4 py-3 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-slate-950/40 dark:text-blue-200">
            <div className="font-semibold">Connected routes</div>
            <div className="mt-1">{connectedRouteCount} high-intent paths from explore</div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Discovery controls</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Search, sort, and switch across listings, auctions, and launched tokens on ARC.</p>
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
                  {showFilters ? 'Hide guidance' : 'Search tips'}
                </button>
              </div>
            </div>

            <div className="relative mb-4 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search names, collections, token IDs, or wallet owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-neutral-300 bg-white py-3 pl-12 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto whitespace-nowrap pb-2">
              <ModePill active={viewMode === 'all'} onClick={() => { setViewMode('all'); setCurrentPage(1); }} label="All" count={allNFTs.length} />
              <ModePill active={viewMode === 'listings'} onClick={() => { setViewMode('listings'); setCurrentPage(1); }} label="Listings" count={listings.length} />
              <ModePill active={viewMode === 'auctions'} onClick={() => { setViewMode('auctions'); setCurrentPage(1); }} label="Auctions" count={auctions.length} />
              <ModePill active={viewMode === 'tokens'} onClick={() => { setViewMode('tokens'); setCurrentPage(1); }} label="Tokens" count={tokenMarketCount} />
            </div>

            {showFilters && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-400">
                Start broad with All, then switch to Listings, Auctions, or Tokens to tighten the ARC discovery surface. Use the search bar to match names, collection labels, token IDs, or wallet owners.
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
                    ? 'Launched tokens now sit inside the same ARC discovery system as marketplace inventory.'
                    : 'A cleaner browsing surface for listings and auctions with stronger ARC navigation context.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                <Flame className="h-3.5 w-3.5" />
                {viewMode === 'tokens' ? 'Launchpad mode' : 'Marketplace mode'}
              </span>
            </div>

            {viewMode === 'tokens' && (
              <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">Token route handoff</div>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      Use token mode to move directly from discovery into trader-facing market pages, or launch a new token if this surface is still empty.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/launch" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                      <Rocket className="h-4 w-4" />
                      Launch now
                    </Link>
                    <Link href="/stats" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                      Stats
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/rewards" className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                      <Trophy className="h-4 w-4" />
                      Rewards
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'tokens' ? (
              tokensLoading ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading launched-token markets
                  </div>
                  <p className="mt-2">ARC is resolving the latest token routes so users can jump directly into live market pages.</p>
                </div>
              ) : tokenMarketCount === 0 ? (
                <div>
                  <EmptyState
                    title="No launched token markets yet"
                    description="Launch the first token to seed this discovery surface, or return to marketplace inventory while token routes index."
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/launch" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
                      <Rocket className="h-4 w-4" />
                      Launch a token
                    </Link>
                    <button
                      onClick={() => setViewMode('all')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-5 py-3 font-semibold text-neutral-900 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Browse inventory
                    </button>
                  </div>
                </div>
              ) : (
                <TokenGrid tokens={launchedTokens} isLoading={tokensLoading} />
              )
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
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Creator routes</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                Discovery
              </span>
            </div>
            <div className="space-y-3">
              {connectedRoutes.map((route) => (
                <ShortcutCard key={route.title} icon={route.icon} title={route.title} description={route.description} href={route.href} />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Market watch</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300">
                <Radio className="h-3.5 w-3.5" />
                Live
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
            <h2 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-white">Discovery guide</h2>
            <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <GuideRow title="Start with All" description="Use the combined view when you want the widest picture of what is active on ARC right now." />
              <GuideRow title="Switch into Tokens" description="Move into token mode when you want launchpad-native markets and trader-facing routes." />
              <GuideRow title="Follow connected routes" description="Use Launchpad, Stats, Rewards, and Profile to move between discovery, creation, and analytics." />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
