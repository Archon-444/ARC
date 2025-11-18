/**
 * Collection Page
 *
 * Displays all NFTs in a collection with collection stats,
 * filtering, and sorting capabilities
 */

'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { TrendingUp, Package, Users, ExternalLink, Share2 } from 'lucide-react';
import { NFTGrid } from '@/components/nft/NFTCard';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ErrorPage } from '@/components/ui/ErrorDisplay';
import { fetchListings, fetchAuctions } from '@/lib/graphql-client';
import {
  formatUSDC,
  formatCompactUSDC,
  formatNumber,
  truncateAddress,
  getImageUrl,
  getAddressUrl,
  debounce,
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
  const allNFTs: NFT[] = [
    ...listings.map((listing) => listing.nft).filter(Boolean) as NFT[],
    ...auctions.map((auction) => auction.nft).filter(Boolean) as NFT[],
  ];

  // Filter based on view mode
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
      nft.tokenId?.toString().includes(query) ||
      nft.description?.toLowerCase().includes(query)
    );
  });

  // Create lookup maps
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
    <div className="min-h-screen bg-gray-50">
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
      <div className="container mx-auto px-4">
        <div className="-mt-16 mb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            {/* Collection Logo */}
            <div className="relative h-32 w-32 overflow-hidden rounded-lg border-4 border-white bg-white shadow-xl">
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
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {collection?.name || 'Unknown Collection'}
                    </h1>
                    {collection?.description && (
                      <p className="mt-2 text-gray-600">{collection.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50">
                      <Share2 className="h-5 w-5 text-gray-600" />
                    </button>
                    <a
                      href={getAddressUrl(address as Address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-5 w-5 text-gray-600" />
                    </a>
                  </div>
                </div>

                {/* Collection Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {collection?.floorPrice && (
                    <div>
                      <p className="text-sm text-gray-600">Floor Price</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatUSDC(collection.floorPrice)}
                      </p>
                    </div>
                  )}
                  {collection?.volumeTraded && (
                    <div>
                      <p className="text-sm text-gray-600">Total Volume</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCompactUSDC(collection.volumeTraded)}
                      </p>
                    </div>
                  )}
                  {collection?.totalSupply && (
                    <div>
                      <p className="text-sm text-gray-600">Total Supply</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatNumber(collection.totalSupply)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Items Listed</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatNumber(listings.length + auctions.length)}
                    </p>
                  </div>
                </div>

                {/* Contract Address */}
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <span>Contract:</span>
                  <a
                    href={getAddressUrl(address as Address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {truncateAddress(address as Address)}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name or token ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Sort */}
            <select
              value={sortBy.value}
              onChange={(e) => {
                const option = SORT_OPTIONS.find((opt) => opt.value === e.target.value);
                if (option) setSortBy(option);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Tabs */}
          <div className="mt-4 flex gap-4 border-t border-gray-200 pt-4">
            <button
              onClick={() => {
                setViewMode('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({allNFTs.length})
            </button>
            <button
              onClick={() => {
                setViewMode('listings');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'listings'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Listings ({listings.length})
            </button>
            <button
              onClick={() => {
                setViewMode('auctions');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'auctions'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Auctions ({auctions.length})
            </button>
          </div>
        </div>

        {/* NFT Grid */}
        <div className="mb-8">
          <NFTGrid
            nfts={filteredNFTs}
            listings={listingsMap}
            auctions={auctionsMap}
            isLoading={isLoading}
            emptyMessage="No items in this collection"
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
  );
}
