'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import NFTCard from '@/components/NFTCard';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_COLLECTION } from '@/graphql/queries';
import { formatUSDC } from '@/hooks/useMarketplace';

type SortOption = 'recently-listed' | 'price-low-high' | 'price-high-low' | 'token-id';

export default function CollectionPage() {
  const params = useParams();
  const address = params?.address as string;

  const [collection, setCollection] = useState<any>(null);
  const [nfts, setNfts] = useState<any[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recently-listed');
  const [filterStatus, setFilterStatus] = useState<'all' | 'listed' | 'auction'>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  useEffect(() => {
    if (address) {
      loadCollection();
    }
  }, [address]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [nfts, sortBy, filterStatus, priceRange]);

  const loadCollection = async () => {
    setLoading(true);
    try {
      const data: any = await fetchGraphQL(GET_COLLECTION, {
        id: address.toLowerCase(),
      });

      if (data.collection) {
        setCollection(data.collection);
        setNfts(data.collection.nfts || []);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...nfts];

    // Filter by status
    if (filterStatus === 'listed') {
      filtered = filtered.filter((nft) => nft.listing?.active);
    } else if (filterStatus === 'auction') {
      filtered = filtered.filter((nft) => nft.auction && !nft.auction.settled);
    }

    // Filter by price range
    if (priceRange.min || priceRange.max) {
      filtered = filtered.filter((nft) => {
        const price = nft.listing?.active
          ? BigInt(nft.listing.price)
          : nft.auction && !nft.auction.settled
          ? BigInt(nft.auction.highestBid || nft.auction.reservePrice)
          : BigInt(0);

        const minPrice = priceRange.min ? BigInt(parseFloat(priceRange.min) * 1e6) : BigInt(0);
        const maxPrice = priceRange.max ? BigInt(parseFloat(priceRange.max) * 1e6) : BigInt(Number.MAX_SAFE_INTEGER);

        return price >= minPrice && price <= maxPrice && price > BigInt(0);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low-high': {
          const priceA = a.listing?.active
            ? BigInt(a.listing.price)
            : a.auction
            ? BigInt(a.auction.highestBid || a.auction.reservePrice)
            : BigInt(Number.MAX_SAFE_INTEGER);
          const priceB = b.listing?.active
            ? BigInt(b.listing.price)
            : b.auction
            ? BigInt(b.auction.highestBid || b.auction.reservePrice)
            : BigInt(Number.MAX_SAFE_INTEGER);
          return priceA < priceB ? -1 : 1;
        }
        case 'price-high-low': {
          const priceA = a.listing?.active
            ? BigInt(a.listing.price)
            : a.auction
            ? BigInt(a.auction.highestBid || a.auction.reservePrice)
            : BigInt(0);
          const priceB = b.listing?.active
            ? BigInt(b.listing.price)
            : b.auction
            ? BigInt(b.auction.highestBid || b.auction.reservePrice)
            : BigInt(0);
          return priceB > priceA ? 1 : -1;
        }
        case 'token-id':
          return parseInt(a.tokenId) - parseInt(b.tokenId);
        default: // recently-listed
          return (b.listing?.createdAt || 0) - (a.listing?.createdAt || 0);
      }
    });

    setFilteredNFTs(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <svg
          className="h-16 w-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Collection Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          The collection you're looking for doesn't exist or hasn't been indexed yet.
        </p>
      </div>
    );
  }

  const stats = {
    totalVolume: collection.totalVolume ? formatUSDC(BigInt(collection.totalVolume)) : '0',
    totalSales: collection.totalSales || '0',
    floorPrice: collection.floorPrice ? formatUSDC(BigInt(collection.floorPrice)) : 'N/A',
    items: collection.nfts?.length || 0,
    listed: nfts.filter((nft) => nft.listing?.active).length,
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>

        {/* Collection Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
              {/* Collection Avatar */}
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-gray-800 rounded-xl border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center">
                <svg
                  className="w-16 h-16 md:w-20 md:h-20 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>

              {/* Collection Details */}
              <div className="mt-6 md:mt-0 md:mb-4 flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {collection.name || 'Unknown Collection'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {collection.symbol || 'N/A'}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-lg">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Volume</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVolume}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">USDC</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Floor Price</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.floorPrice}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">USDC</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSales}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Items</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.items}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Listed</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.listed}</p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All ({nfts.length})
          </button>
          <button
            onClick={() => setFilterStatus('listed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'listed'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Listed ({stats.listed})
          </button>
          <button
            onClick={() => setFilterStatus('auction')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'auction'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Auctions
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recently-listed">Recently Listed</option>
            <option value="price-low-high">Price: Low to High</option>
            <option value="price-high-low">Price: High to Low</option>
            <option value="token-id">Token ID</option>
          </select>
        </div>
      </div>

      {/* NFT Grid */}
      {filteredNFTs.length === 0 ? (
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
            Try adjusting your filters
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
