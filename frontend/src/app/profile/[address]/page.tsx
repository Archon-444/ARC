'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { fetchGraphQL } from '@/lib/graphql-client';
import { GET_USER } from '@/graphql/queries';
import NFTCard from '@/components/NFTCard';
import { formatUSDC } from '@/hooks/useMarketplace';

type TabType = 'owned' | 'created' | 'activity' | 'listings';

interface Activity {
  id: string;
  price: string;
  createdAt: string;
  nft: {
    id: string;
    tokenId: string;
    tokenURI: string;
    collection: {
      name: string;
    };
  };
  type: 'purchase' | 'sale';
}

export default function ProfilePage() {
  const params = useParams();
  const profileAddress = params?.address as string;
  const { address: connectedAddress } = useAccount();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('owned');
  const [copiedAddress, setCopiedAddress] = useState(false);

  const isOwnProfile = connectedAddress?.toLowerCase() === profileAddress?.toLowerCase();

  useEffect(() => {
    if (profileAddress) {
      loadUserData();
    }
  }, [profileAddress]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userId = profileAddress.toLowerCase();
      const data: any = await fetchGraphQL(GET_USER, { id: userId });

      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(profileAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Combine purchases and sales into activity feed
  const activities: Activity[] = user
    ? [
        ...(user.purchases || []).map((p: any) => ({ ...p, type: 'purchase' as const })),
        ...(user.sales || []).map((s: any) => ({ ...s, type: 'sale' as const })),
      ].sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This user doesn't exist or hasn't interacted with the marketplace yet.
        </p>
        <Link
          href="/explore"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Browse NFTs
        </Link>
      </div>
    );
  }

  const ownedNFTs = user.ownedNFTs || [];
  const createdNFTs = user.createdNFTs || [];
  const activeListings = user.listings || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Profile Info */}
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {profileAddress.slice(2, 4).toUpperCase()}
            </div>

            {/* Address and Stats */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isOwnProfile ? 'Your Profile' : `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}`}
                </h1>
                {isOwnProfile && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded">
                    You
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-mono">{profileAddress}</span>
                <button
                  onClick={copyAddress}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Owned</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{ownedNFTs.length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Created</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{createdNFTs.length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatUSDC(BigInt(user.totalSpent || 0))}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">USDC</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatUSDC(BigInt(user.totalEarned || 0))}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">USDC</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('owned')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'owned'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Owned ({ownedNFTs.length})
        </button>
        <button
          onClick={() => setActiveTab('created')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'created'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Created ({createdNFTs.length})
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'listings'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Listings ({activeListings.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'activity'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Activity ({activities.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'owned' && (
        <div>
          {ownedNFTs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No NFTs owned</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isOwnProfile ? 'Start by purchasing your first NFT' : 'This user doesn\'t own any NFTs yet'}
              </p>
              {isOwnProfile && (
                <Link
                  href="/explore"
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Explore NFTs
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ownedNFTs.map((nft: any) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'created' && (
        <div>
          {createdNFTs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No NFTs created</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isOwnProfile ? 'Start creating your first NFT' : 'This user hasn\'t created any NFTs yet'}
              </p>
              {isOwnProfile && (
                <Link
                  href="/studio"
                  className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Go to Studio
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {createdNFTs.map((nft: any) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div>
          {activeListings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No active listings</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isOwnProfile ? 'List your NFTs for sale' : 'This user has no active listings'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeListings.map((listing: any) => {
                const nftWithListing = {
                  ...listing.nft,
                  listing: {
                    id: listing.id,
                    price: listing.price,
                    active: true,
                  },
                };
                return <NFTCard key={listing.id} nft={nftWithListing} />;
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          {activities.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activity yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isOwnProfile ? 'Your marketplace activity will appear here' : 'This user has no activity yet'}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Activity Icon */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'purchase'
                              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {activity.type === 'purchase' ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Activity Details */}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {activity.type === 'purchase' ? 'Purchased' : 'Sold'}{' '}
                            <Link
                              href={`/nft/${activity.nft.collection}/${activity.nft.tokenId}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {activity.nft.collection.name} #{activity.nft.tokenId}
                            </Link>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(parseInt(activity.createdAt) * 1000).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatUSDC(BigInt(activity.price))} USDC
                        </p>
                        <p
                          className={`text-sm ${
                            activity.type === 'sale'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {activity.type === 'sale' ? '+' : '-'}
                          {formatUSDC(BigInt(activity.price))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
