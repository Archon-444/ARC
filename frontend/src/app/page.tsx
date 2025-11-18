'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NFTListing {
  id: string;
  name: string;
  image: string;
  price: string;
  collection: string;
}

export default function HomePage() {
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch listings from subgraph/backend
    // For now, show placeholder data
    setTimeout(() => {
      setListings([
        {
          id: '1',
          name: 'Arc NFT #1',
          image: '/placeholder.png',
          price: '100',
          collection: 'Arc Collection',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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

        {loading ? (
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
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
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {listings.map((nft) => (
              <Link
                key={nft.id}
                href={`/nft/${nft.collection}/${nft.id}`}
                className="bg-white dark:bg-secondary-800 rounded-xl overflow-hidden border border-secondary-200 dark:border-secondary-700 hover:shadow-lg transition group"
              >
                <div className="aspect-square bg-secondary-200 dark:bg-secondary-700 relative overflow-hidden">
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
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                    {nft.name}
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                    {nft.collection}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      Price
                    </span>
                    <span className="font-semibold text-secondary-900 dark:text-white">
                      {nft.price} USDC
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
