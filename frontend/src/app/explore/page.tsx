/**
 * Explore Page
 *
 * Browse all NFTs, listings, and auctions on ArcMarket
 * Features filtering, search, sorting, and pagination
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, TrendingUp, Package } from 'lucide-react';
import { NFTGrid } from '@/components/nft/NFTCard';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay, EmptyState } from '@/components/ui/ErrorDisplay';
import { fetchListings, fetchAuctions, fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatUSDC, formatCompactUSDC, formatNumber, debounce } from '@/lib/utils';
import type { NFT, Listing, Auction, MarketplaceStats, SortOption } from '@/types';

type ViewMode = 'all' | 'listings' | 'auctions';

const ITEMS_PER_PAGE = 20;

const SORT_OPTIONS: SortOption[] = [
  { label: 'Recently Listed', value: 'recent', orderBy: 'createdAt', orderDirection: 'desc' },
  { label: 'Price: Low to High', value: 'price_asc', orderBy: 'price', orderDirection: 'asc' },
  { label: 'Price: High to Low', value: 'price_desc', orderBy: 'price', orderDirection: 'desc' },
  { label: 'Ending Soon', value: 'ending', orderBy: 'endTime', orderDirection: 'asc' },
];

export default function ExplorePage() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Data state
  const [listings, setListings] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      setCurrentPage(1); // Reset to first page on search
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  // Load marketplace stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load data when view mode or pagination changes
  useEffect(() => {
    loadData();
  }, [viewMode, currentPage, sortBy, debouncedSearch]);

  const loadStats = async () => {
    try {
      const statsData = await fetchMarketplaceStats();
      if (statsData) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
      // Don't block page load if stats fail
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

  // Combine NFTs from listings and auctions
  const allNFTs: NFT[] = [
    ...listings.map((listing) => listing.nft).filter(Boolean) as NFT[],
    ...auctions.map((auction) => auction.nft).filter(Boolean) as NFT[],
  ];

  // Filter NFTs based on view mode
  const displayNFTs = (() => {
    if (viewMode === 'listings') {
      return listings.map((listing) => listing.nft).filter(Boolean) as NFT[];
    }
    if (viewMode === 'auctions') {
      return auctions.map((auction) => auction.nft).filter(Boolean) as NFT[];
    }
    return allNFTs;
  })();

  // Search filter
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

  // Create lookup maps for listings and auctions
  const listingsMap: Record<string, Listing> = {};
  listings.forEach((listing) => {
    if (listing.nft) {
      const key = `${listing.collection.toLowerCase()}-${listing.tokenId}`;
      listingsMap[key] = listing;
    }
  });

  const auctionsMap: Record<string, Auction> = {};
  auctions.forEach((auction) => {
    if (auction.nft) {
      const key = `${auction.collection.toLowerCase()}-${auction.tokenId}`;
      auctionsMap[key] = auction;
    }
  });

  // Calculate total pages (estimate)
  const totalPages = Math.ceil((filteredNFTs.length || ITEMS_PER_PAGE) / ITEMS_PER_PAGE);

  // Loading state
  if (isLoading && !listings.length && !auctions.length) {
    return <LoadingPage label="Loading NFTs..." />;
  }

  // Error state
  if (error && !listings.length && !auctions.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorDisplay error={error} title="Failed to load NFTs" onRetry={loadData} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">Explore NFTs</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Discover unique digital assets on Circle Arc blockchain
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatsCard
              label="Total Volume"
              value={formatCompactUSDC(stats.totalVolume)}
              icon={TrendingUp}
            />
            <StatsCard
              label="Total Sales"
              value={formatNumber(stats.totalSales)}
              icon={Package}
            />
            <StatsCard
              label="Active Listings"
              value={formatNumber(stats.activeListings)}
            />
            <StatsCard
              label="Active Auctions"
              value={formatNumber(stats.activeAuctions)}
            />
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, collection, or token ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
            />
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex gap-3">
            <select
              value={sortBy.value}
              onChange={(e) => {
                const option = SORT_OPTIONS.find((opt) => opt.value === e.target.value);
                if (option) setSortBy(option);
              }}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-700">
          <TabButton
            active={viewMode === 'all'}
            onClick={() => {
              setViewMode('all');
              setCurrentPage(1);
            }}
            label="All"
            count={allNFTs.length}
          />
          <TabButton
            active={viewMode === 'listings'}
            onClick={() => {
              setViewMode('listings');
              setCurrentPage(1);
            }}
            label="Listings"
            count={listings.length}
          />
          <TabButton
            active={viewMode === 'auctions'}
            onClick={() => {
              setViewMode('auctions');
              setCurrentPage(1);
            }}
            label="Auctions"
            count={auctions.length}
          />
        </div>

        {/* NFT Grid */}
        {filteredNFTs.length === 0 && !isLoading ? (
          <EmptyState
            title="No NFTs found"
            description={
              debouncedSearch
                ? 'Try adjusting your search query or filters'
                : 'No NFTs are currently available in this category'
            }
          />
        ) : (
          <>
            <NFTGrid
              nfts={filteredNFTs}
              listings={listingsMap}
              auctions={auctionsMap}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Helper Components

function StatsCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      {Icon && (
        <div className="mb-2">
          <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
      )}
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 font-medium transition-colors ${
        active
          ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">({count})</span>
      )}
    </button>
  );
}
