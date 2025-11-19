'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Clock, Star, Zap } from 'lucide-react';
import { fetchListings, fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatUSDC, formatCompactUSDC } from '@/lib/utils';
import { Button, Card, Badge } from '@/components/ui';
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
      // Fetch featured listings (first 12, most recent)
      const listingsData = await fetchListings({
        first: 12,
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-20 md:py-32">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="primary" size="lg" className="mb-6 animate-slide-down">
              <Star className="w-4 h-4" />
              Premier NFT Marketplace on Arc
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Discover, Collect & Sell{' '}
              <span className="text-gradient">Extraordinary NFTs</span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 mb-10 animate-fade-in">
              The fastest NFT marketplace powered by Circle Arc blockchain with instant USDC settlements
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button asChild size="lg" className="text-lg">
                <Link href="/explore">
                  <Zap className="w-5 h-5" />
                  Explore NFTs
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link href="/studio">
                  Create
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-200/30 dark:bg-accent-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </section>

      <div className="container-custom space-y-16 py-16">
        {/* Marketplace Stats */}
        {stats && (
          <section>
            <Card padding="lg" className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/10 dark:to-accent-900/10 border-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Total Volume
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {formatCompactUSDC(stats.totalVolume)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Total Sales
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {stats.totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Active Listings
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {stats.activeListings.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    Live Auctions
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {stats.activeAuctions.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Key Features */}
        <section>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
            Why Choose ArcMarket?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card hover padding="lg" className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-primary">
                <svg
                  className="w-8 h-8 text-white"
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
              <h3 className="text-xl font-semibold mb-3">USDC Payments</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                All transactions in stable USDC with instant finality on Arc blockchain
              </p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-accent">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Sub-second finality means instant ownership transfer and settlements
              </p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-8 h-8 text-white"
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
              <h3 className="text-xl font-semibold mb-3">Creator Royalties</h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Automatic royalty distribution on every secondary sale
              </p>
            </Card>
          </div>
        </section>

        {/* Featured NFTs */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                Featured NFTs
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Discover the latest and greatest from our community
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/explore">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {error ? (
            <Card padding="lg" className="text-center bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800">
              <p className="text-error-600 dark:text-error-400 mb-4 font-medium">
                Failed to load NFTs
              </p>
              <Button onClick={loadData} variant="danger">
                Retry
              </Button>
            </Card>
          ) : loading ? (
            <div className="nft-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} padding="none" className="overflow-hidden animate-pulse">
                  <div className="aspect-square skeleton-shimmer" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 skeleton rounded" />
                    <div className="h-4 skeleton rounded w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card padding="lg" className="text-center bg-neutral-50 dark:bg-neutral-800">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-neutral-400"
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
                </div>
                <h3 className="text-xl font-semibold mb-2">No NFTs Listed Yet</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Be the first to list an NFT on ArcMarket and start your collection
                </p>
                <Button asChild>
                  <Link href="/studio">
                    Create NFT
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="nft-grid">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/nft/${listing.collection}/${listing.tokenId}`}
                >
                  <Card hover padding="none" className="overflow-hidden h-full group">
                    <div className="aspect-square bg-neutral-200 dark:bg-neutral-700 relative overflow-hidden">
                      {listing.nft?.image ? (
                        <img
                          src={listing.nft.image}
                          alt={listing.nft?.name || `Token #${listing.tokenId}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-400 dark:text-neutral-600">
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
                      <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                        {listing.nft?.name || `Token #${listing.tokenId}`}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 truncate">
                        {listing.nft?.collection?.name || 'Unknown Collection'}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          Price
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {formatUSDC(listing.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden">
          <Card padding="none" className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-600 border-0 overflow-hidden">
            <div className="relative z-10 py-16 px-8 text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Ready to Earn Rewards?</h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Stake USDC to earn rewards and unlock reduced marketplace fees
              </p>
              <Button asChild size="lg" className="bg-white text-primary-600 hover:bg-neutral-100">
                <Link href="/staking">
                  Start Staking
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl" />
          </Card>
        </section>
      </div>
    </div>
  );
}
