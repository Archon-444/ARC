'use client';

import { useState, useEffect } from 'react';
import NFTCard from '@/components/NFTCard';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_ACTIVE_LISTINGS, GET_ACTIVE_AUCTIONS, GET_MARKETPLACE_STATS } from '@/graphql/queries';

type ViewMode = 'all' | 'listings' | 'auctions';

interface MarketplaceStats {
  totalVolume: string;
  totalSales: string;
  activeListings: string;
  activeAuctions: string;
}

export default function ExplorePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [listings, setListings] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch marketplace stats
      const statsData: any = await fetchGraphQL(GET_MARKETPLACE_STATS);
      if (statsData.marketplaceStats) {
        setStats(statsData.marketplaceStats);
      }

      // Fetch active listings
      const listingsData: any = await fetchGraphQL(GET_ACTIVE_LISTINGS, {
        first: 50,
        skip: 0,
      });
      setListings(listingsData.listings || []);

      // Fetch active auctions
      const auctionsData: any = await fetchGraphQL(GET_ACTIVE_AUCTIONS, {
        first: 50,
        skip: 0,
      });
      setAuctions(auctionsData.auctions || []);
    } catch (error) {
      console.error('Error loading explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert listings to NFT format for NFTCard
  const listingNFTs = listings.map((listing) => ({
    ...listing.nft,
    listing: {
      id: listing.id,
      price: listing.price,
      active: true,
    },
  }));

  // Convert auctions to NFT format for NFTCard
  const auctionNFTs = auctions.map((auction) => ({
    ...auction.nft,
    auction: {
      id: auction.id,
      reservePrice: auction.reservePrice,
      highestBid: auction.highestBid,
      endTime: auction.endTime,
      settled: auction.settled,
    },
  }));

  // Combine and filter based on view mode
  const allNFTs = [...listingNFTs, ...auctionNFTs];
  const displayNFTs =
    viewMode === 'all'
      ? allNFTs
      : viewMode === 'listings'
      ? listingNFTs
      : auctionNFTs;

  // Filter by search query
  const filteredNFTs = displayNFTs.filter((nft) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      nft.collection?.name?.toLowerCase().includes(query) ||
      nft.tokenId?.toString().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Explore NFTs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover unique digital assets on Arc blockchain
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search collections or token ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 px-4 py-2 pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Volume
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(parseInt(stats.totalVolume) / 1e6).toLocaleString()} USDC
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Sales
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {parseInt(stats.totalSales).toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Active Listings
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.activeListings}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Active Auctions
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.activeAuctions}
            </p>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'all'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          All ({allNFTs.length})
        </button>
        <button
          onClick={() => setViewMode('listings')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'listings'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Listings ({listingNFTs.length})
        </button>
        <button
          onClick={() => setViewMode('auctions')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'auctions'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Auctions ({auctionNFTs.length})
        </button>
      </div>

      {/* NFT Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md animate-pulse"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNFTs.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No NFTs found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'No NFTs are currently available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}
