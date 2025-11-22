/**
 * Collection Page
 *
 * Displays all NFTs in a collection with collection stats,
 * filtering, and sorting capabilities
 */

'use client';

import { use, useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { TrendingUp, Package, Users, ExternalLink, Share2, Filter } from 'lucide-react';
import { NFTGrid } from '@/components/nft/NFTCard';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ErrorPage } from '@/components/ui/ErrorDisplay';
import { FilterPanel, type CollectionFilters } from '@/components/collection/FilterPanel';
import { fetchListings, fetchAuctions } from '@/lib/graphql-client';
import {
  formatUSDC,
  formatCompactUSDC,
  formatNumber,
  truncateAddress,
  getImageUrl,
  getAddressUrl,
  debounce,
  cn,
} from '@/lib/utils';
import type { NFT, Listing, Auction, Collection, Address, SortOption } from '@/types';

const ITEMS_PER_PAGE = 24;

const SORT_OPTIONS: SortOption[] = [
  { label: 'Recently Listed', value: 'recent', orderBy: 'createdAt', orderDirection: 'desc' },
  { label: 'Price: Low to High', value: 'price_asc', orderBy: 'price', orderDirection: 'asc' },
  { label: 'Price: High to Low', value: 'price_desc', orderBy: 'price', orderDirection: 'desc' },
  { label: 'Token ID: Low to High', value: 'id_asc', orderBy: 'tokenId', orderDirection: 'asc' },
  { label: 'Token ID: High to Low', value: 'id_desc', orderBy: 'tokenId', orderDirection: 'desc' },
];

interface PageProps {
  params: Promise<{
    address: string;
  }>;
}

export default function CollectionPage({ params }: PageProps) {
  const { address } = use(params);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'listings' | 'auctions'>('all');

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filters, setFilters] = useState<CollectionFilters>({
    traits: {},
    status: [],
  });

  // Debounce search
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

  // Load collection data
  useEffect(() => {
    loadCollectionData();
  }, [address, currentPage, sortBy, viewMode]);

  const loadCollectionData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;

      // Fetch listings for this collection
      if (viewMode === 'all' || viewMode === 'listings') {
        const listingsData = await fetchListings({
          first: ITEMS_PER_PAGE,
          skip,
          orderBy: sortBy.orderBy,
          orderDirection: sortBy.orderDirection,
        });

        // Filter by collection address
        const collectionListings = listingsData.filter(
          (listing) => listing.collection.toLowerCase() === address.toLowerCase()
        );
        setListings(collectionListings);

        // Extract collection info from first listing
        if (collectionListings.length > 0 && collectionListings[0].nft?.collection) {
          setCollection(collectionListings[0].nft.collection);
        }
      }

      // Fetch auctions for this collection
      if (viewMode === 'all' || viewMode === 'auctions') {
        const auctionsData = await fetchAuctions({
          first: ITEMS_PER_PAGE,
          skip,
        });

        // Filter by collection address
        const collectionAuctions = auctionsData.filter(
          (auction) => auction.collection.toLowerCase() === address.toLowerCase()
        );
        setAuctions(collectionAuctions);

        // Extract collection info if not already set
        if (!collection && collectionAuctions.length > 0 && collectionAuctions[0].nft?.collection) {
          setCollection(collectionAuctions[0].nft.collection);
        }
      }
    } catch (err) {
      console.error('Failed to load collection:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine NFTs from listings and auctions
  const allNFTs: NFT[] = useMemo(() => [
    ...listings.map((listing) => listing.nft).filter(Boolean) as NFT[],
    ...auctions.map((auction) => auction.nft).filter(Boolean) as NFT[],
  ], [listings, auctions]);

  // Create lookup maps
  const listingsMap = useMemo(() => {
    const map: Record<string, Listing> = {};
    listings.forEach((listing) => {
      if (listing.nft) {
        const key = `${listing.collection.toLowerCase()}-${listing.tokenId}`;
        map[key] = listing;
      }
    });
    return map;
  }, [listings]);

  const auctionsMap = useMemo(() => {
    const map: Record<string, Auction> = {};
    auctions.forEach((auction) => {
      if (auction.nft) {
        const key = `${auction.collection.toLowerCase()}-${auction.tokenId}`;
        map[key] = auction;
      }
    });
    return map;
  }, [auctions]);

  // Extract Traits from all loaded NFTs
  const availableTraits = useMemo(() => {
    const traitMap = new Map<string, Map<string, number>>();
    let totalCount = 0;

    allNFTs.forEach((nft) => {
      if (nft.attributes) {
        totalCount++;
        nft.attributes.forEach((attr) => {
          if (!traitMap.has(attr.trait_type)) {
            traitMap.set(attr.trait_type, new Map());
          }
          const values = traitMap.get(attr.trait_type)!;
          const val = String(attr.value);
          values.set(val, (values.get(val) || 0) + 1);
        });
      }
    });

    return Array.from(traitMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values.entries()).map(([value, count]) => ({
        value,
        count,
        percentage: (count / totalCount) * 100,
      })).sort((a, b) => b.count - a.count),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allNFTs]);

  // Filter Logic
  const filteredNFTs = useMemo(() => {
    return allNFTs.filter((nft) => {
      // 1. Search Filter
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesSearch =
          nft.name?.toLowerCase().includes(query) ||
          nft.tokenId?.toString().includes(query) ||
          nft.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 2. View Mode Filter (Listings vs Auctions)
      const key = `${nft.collection.id.toLowerCase()}-${nft.tokenId}`;
      const isListed = !!listingsMap[key];
      const isAuctioned = !!auctionsMap[key];

      if (viewMode === 'listings' && !isListed) return false;
      if (viewMode === 'auctions' && !isAuctioned) return false;

      // 3. Status Filter
      if (filters.status.length > 0) {
        const matchesStatus = filters.status.some(status => {
          if (status === 'Buy Now') return isListed;
          if (status === 'On Auction') return isAuctioned;
          // 'Has Offers' would need offer data
          return false;
        });
        if (!matchesStatus) return false;
      }

      // 4. Price Filter
      const price = isListed ? parseFloat(listingsMap[key].price) :
        isAuctioned ? parseFloat(auctionsMap[key].minBid) : 0; // Use minBid for auctions

      if (filters.priceMin !== undefined && price < filters.priceMin) return false;
      if (filters.priceMax !== undefined && price > filters.priceMax) return false;

      // 5. Trait Filter
      if (Object.keys(filters.traits).length > 0) {
        const matchesTraits = Object.entries(filters.traits).every(([traitName, selectedValues]) => {
          if (!selectedValues || selectedValues.length === 0) return true;
          const nftTrait = nft.attributes?.find(a => a.trait_type === traitName);
          return nftTrait && selectedValues.includes(String(nftTrait.value));
        });
        if (!matchesTraits) return false;
      }

      return true;
    });
  }, [allNFTs, debouncedSearch, viewMode, filters, listingsMap, auctionsMap]);

  const totalPages = Math.ceil((filteredNFTs.length || ITEMS_PER_PAGE) / ITEMS_PER_PAGE);

  if (isLoading && !listings.length && !auctions.length) {
    return <LoadingPage label="Loading collection..." />;
  }

  if (error && !collection) {
    return <ErrorPage error={error} onRetry={loadCollectionData} />;
  }

  const bannerUrl = collection?.bannerImage ? getImageUrl(collection.bannerImage) : undefined;
  const logoUrl = collection?.image ? getImageUrl(collection.image) : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Collection Banner */}
      <div className="relative h-64 bg-gradient-to-br from-blue-500 to-purple-600">
        {bannerUrl && (
          <Image
            src={bannerUrl}
            alt={collection?.name || 'Collection banner'}
            fill
            className="object-cover"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Collection Header */}
      <div className="container-custom mx-auto px-4">
        <div className="-mt-16 mb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            {/* Collection Logo */}
            <div className="relative h-32 w-32 overflow-hidden rounded-xl border-4 border-white dark:border-neutral-800 bg-white dark:bg-neutral-800 shadow-xl">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={collection?.name || 'Collection logo'}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                  <Package className="h-16 w-16 text-white" />
                </div>
              )}
            </div>

            {/* Collection Info */}
            <div className="flex-1">
              <div className="rounded-xl bg-white dark:bg-neutral-800 p-6 shadow-lg border border-neutral-200 dark:border-neutral-700">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {collection?.name || 'Unknown Collection'}
                    </h1>
                    {collection?.description && (
                      <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">{collection.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-gray-300 dark:border-neutral-600 p-2 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                      <Share2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <a
                      href={getAddressUrl(address as Address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 dark:border-neutral-600 p-2 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </a>
                  </div>
                </div>

                {/* Collection Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {collection?.floorPrice && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Floor Price</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatUSDC(collection.floorPrice)}
                      </p>
                    </div>
                  )}
                  {collection?.volumeTraded && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Volume</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCompactUSDC(collection.volumeTraded)}
                      </p>
                    </div>
                  )}
                  {collection?.totalSupply && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Supply</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(collection.totalSupply)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Items Listed</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(listings.length + auctions.length)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls & Layout */}
        <div className="flex gap-6">
          {/* Filter Sidebar (Desktop) */}
          <div
            className={cn(
              "hidden lg:block transition-all duration-300 ease-in-out overflow-hidden",
              isFilterOpen ? "w-80 opacity-100" : "w-0 opacity-0"
            )}
          >
            <div className="sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-2">
              <FilterPanel
                traits={availableTraits}
                onFilterChange={setFilters}
              />
            </div>
          </div>

          {/* Main Grid */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 sticky top-20 z-10 shadow-sm">
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "p-2 rounded-lg border transition-colors hidden lg:flex items-center gap-2",
                    isFilterOpen
                      ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400"
                      : "border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700"
                  )}
                >
                  <Filter className="h-5 w-5" />
                  <span className="text-sm font-medium">Filters</span>
                </button>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 rounded-lg border border-gray-300 dark:border-neutral-600 bg-transparent px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                {/* View Mode Tabs */}
                <div className="flex rounded-lg bg-gray-100 dark:bg-neutral-900 p-1">
                  {(['all', 'listings', 'auctions'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setViewMode(mode);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all",
                        viewMode === mode
                          ? "bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <select
                  value={sortBy.value}
                  onChange={(e) => {
                    const option = SORT_OPTIONS.find((opt) => opt.value === e.target.value);
                    if (option) setSortBy(option);
                  }}
                  className="rounded-lg border border-gray-300 dark:border-neutral-600 bg-transparent px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results */}
            <div className="mb-8">
              <NFTGrid
                nfts={filteredNFTs}
                listings={listingsMap}
                auctions={auctionsMap}
                isLoading={isLoading}
                emptyMessage={
                  <div className="text-center py-12">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No items found</p>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or search query</p>
                    <button
                      onClick={() => {
                        setFilters({ traits: {}, status: [] });
                        setSearchQuery('');
                      }}
                      className="mt-4 text-primary-600 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                }
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
