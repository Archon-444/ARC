'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchListings, fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatUSDC } from '@/lib/utils';
import type { Listing } from '@/types';

interface MarketplaceStats {
  totalVolume: string;
  dailyVolume: string;
  totalSales: number;
  dailySales: number;
  activeListings: number;
  activeAuctions: number;
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch featured listings (first 8, most recent)
      const listingsData = await fetchListings({
        first: 8,
        skip: 0,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });

      // Fetch marketplace stats
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

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-secondary-900 dark:text-white mb-4">
          Discover, Collect, and Sell NFTs
        </h1>
        <p className="text-xl text-secondary-600 dark:text-secondary-300 mb-8">
          The premier NFT marketplace on Arc blockchain with USDC payments
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/explore"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Explore NFTs
          </Link>
          <Link
            href="/studio"
            className="px-8 py-3 bg-secondary-200 dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg font-semibold hover:bg-secondary-300 dark:hover:bg-secondary-600 transition"
          >
            Create
          </Link>
        </div>
      </section>

      {/* Live Stats */}
      {stats && (
        <section className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                Total Volume
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {formatUSDC(stats.totalVolume)} USDC
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                Total Sales
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {stats.totalSales.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                Active Listings
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {stats.activeListings.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                Active Auctions
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {stats.activeAuctions.toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="p-6 bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
            USDC Payments
          </h3>
          <p className="text-secondary-600 dark:text-secondary-300">
            All transactions in USDC with instant finality on Arc blockchain
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
            Instant Settlement
          </h3>
          <p className="text-secondary-600 dark:text-secondary-300">
            Sub-second finality means instant ownership transfer
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
            Creator Royalties
          </h3>
          <p className="text-secondary-600 dark:text-secondary-300">
            Automatic royalty distribution on every secondary sale
          </p>
        </div>
      </section>

      {/* Featured NFTs */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Featured NFTs
          </h2>
          <Link
            href="/explore"
            className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
          >
            View All →
          </Link>
        </div>

        {error ? (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-red-600 dark:text-red-400 mb-4">Failed to load NFTs</p>
            <button
              onClick={loadData}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-secondary-800 rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 animate-pulse"
              >
                <div className="aspect-square bg-secondary-200 dark:bg-secondary-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded" />
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-secondary-50 dark:bg-secondary-800 rounded-xl">
            <svg
              className="mx-auto h-12 w-12 text-secondary-400 mb-4"
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
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
              No NFTs Listed Yet
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
              Be the first to list an NFT on ArcMarket
            </p>
            <Link
              href="/studio"
              className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Create NFT
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {listings.slice(0, 8).map((listing) => (
              <Link
                key={listing.id}
                href={`/nft/${listing.collection}/${listing.tokenId}`}
                className="bg-white dark:bg-secondary-800 rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 hover:shadow-lg transition group"
              >
                <div className="aspect-square bg-secondary-200 dark:bg-secondary-700 relative overflow-hidden">
                  {listing.nft?.image ? (
                    <img
                      src={listing.nft.image}
                      alt={listing.nft?.name || `Token #${listing.tokenId}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-secondary-400 dark:text-secondary-600">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition truncate">
                    {listing.nft?.name || `Token #${listing.tokenId}`}
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 truncate">
                    {listing.nft?.collection?.name || 'Unknown Collection'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      Price
                    </span>
                    <span className="font-semibold text-secondary-900 dark:text-white">
                      {formatUSDC(listing.price)} USDC
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Staking CTA */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Earn Rewards by Staking</h2>
        <p className="text-lg mb-6 opacity-90">
          Stake USDC to earn rewards and unlock reduced marketplace fees
        </p>
        <Link
          href="/staking"
          className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-secondary-50 transition"
        >
          Start Staking
        </Link>
      </section>
    </div>
  );
}
