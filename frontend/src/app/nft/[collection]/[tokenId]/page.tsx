/**
 * NFT Detail Page
 *
 * Displays individual NFT with metadata, listing/auction info,
 * price history, and action buttons (Buy, Bid, List)
 */

'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  Tag,
  TrendingUp,
  ExternalLink,
  Share2,
  Heart,
  ShoppingCart,
  Gavel,
  AlertCircle,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ErrorPage } from '@/components/ui/ErrorDisplay';
import { fetchNFTDetails } from '@/lib/graphql-client';
import {
  formatUSDC,
  formatTimeRemaining,
  formatRelativeTime,
  formatDate,
  truncateAddress,
  getImageUrl,
  getCollectionUrl,
  getProfileUrl,
  getTransactionUrl,
  cn,
  getTimeRemaining,
} from '@/lib/utils';
import type { NFT, Listing, Auction, Sale, Address } from '@/types';

interface PageProps {
  params: Promise<{
    collection: string;
    tokenId: string;
  }>;
}

export default function NFTDetailPage({ params }: PageProps) {
  const { collection, tokenId } = use(params);

  const [nft, setNft] = useState<NFT | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  // Countdown for auctions
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof getTimeRemaining> | null>(null);

  useEffect(() => {
    loadNFT();
  }, [collection, tokenId]);

  // Update countdown every second for active auctions
  useEffect(() => {
    if (!auction || !auction.endTime) return;

    const updateCountdown = () => {
      setTimeRemaining(getTimeRemaining(auction.endTime));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  const loadNFT = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchNFTDetails(collection, tokenId);

      if (!data) {
        throw new Error('NFT not found');
      }

      setNft(data);
      setListing(data.listings?.[0] || null);
      setAuction(data.auctions?.[0] || null);
      setSales(data.sales || []);
    } catch (err) {
      console.error('Failed to load NFT:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingPage label="Loading NFT..." />;
  }

  if (error || !nft) {
    return <ErrorPage error={error || new Error('NFT not found')} onRetry={loadNFT} />;
  }

  const imageUrl = getImageUrl(nft.image);
  const isAuctionActive = auction && timeRemaining && !timeRemaining.isExpired;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column - Image */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={imageUrl}
              alt={nft.name || `NFT #${nft.tokenId}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />

            {/* Auction Badge */}
            {isAuctionActive && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-white shadow-lg">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    {timeRemaining && formatTimeRemaining(auction!.endTime)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="rounded-full bg-white/90 p-3 backdrop-blur-sm hover:bg-white"
                aria-label={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart
                  className={cn('h-5 w-5', isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600')}
                />
              </button>
              <button
                className="rounded-full bg-white/90 p-3 backdrop-blur-sm hover:bg-white"
                aria-label="Share"
              >
                <Share2 className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Attributes */}
          {nft.attributes && nft.attributes.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Attributes</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {nft.attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center"
                  >
                    <p className="text-xs text-gray-600">{attr.trait_type}</p>
                    <p className="font-semibold text-gray-900">{attr.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Collection */}
          {nft.collection && (
            <Link
              href={getCollectionUrl(nft.collection.id)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {nft.collection.name}
            </Link>
          )}

          {/* Name */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              {nft.name || `#${nft.tokenId}`}
            </h1>
            {nft.description && (
              <p className="mt-3 text-gray-600">{nft.description}</p>
            )}
          </div>

          {/* Owner */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Owned by</span>
            <Link
              href={getProfileUrl(nft.owner)}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              {truncateAddress(nft.owner)}
            </Link>
          </div>

          {/* Price Section */}
          {listing && (
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Current Price</p>
                <p className="text-4xl font-bold text-gray-900">{formatUSDC(listing.price)}</p>
              </div>
              <button className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Buy Now
              </button>
            </div>
          )}

          {isAuctionActive && auction && (
            <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
              <div className="mb-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600">
                    {auction.highestBid && auction.highestBid !== '0' ? 'Current Bid' : 'Minimum Bid'}
                  </p>
                  <p className="text-4xl font-bold text-gray-900">
                    {formatUSDC(auction.highestBid && auction.highestBid !== '0' ? auction.highestBid : auction.minBid)}
                  </p>
                </div>
                {auction.highestBidder && auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Highest bidder:</span>
                    <Link
                      href={getProfileUrl(auction.highestBidder as Address)}
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {truncateAddress(auction.highestBidder as Address)}
                    </Link>
                  </div>
                )}
                {timeRemaining && (
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Clock className="h-4 w-4" />
                    <span>
                      Ends in {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m{' '}
                      {timeRemaining.seconds}s
                    </span>
                  </div>
                )}
              </div>
              <button className="w-full rounded-lg bg-purple-600 px-6 py-3 text-lg font-semibold text-white hover:bg-purple-700 flex items-center justify-center gap-2">
                <Gavel className="h-5 w-5" />
                Place Bid
              </button>
            </div>
          )}

          {!listing && !isAuctionActive && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-gray-600">This NFT is not currently listed for sale</p>
            </div>
          )}

          {/* Collection Stats */}
          {nft.collection && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Collection Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                {nft.collection.floorPrice && (
                  <div>
                    <p className="text-sm text-gray-600">Floor Price</p>
                    <p className="font-semibold text-gray-900">{formatUSDC(nft.collection.floorPrice)}</p>
                  </div>
                )}
                {nft.collection.volumeTraded && (
                  <div>
                    <p className="text-sm text-gray-600">Volume Traded</p>
                    <p className="font-semibold text-gray-900">{formatUSDC(nft.collection.volumeTraded)}</p>
                  </div>
                )}
                {nft.collection.totalSupply && (
                  <div>
                    <p className="text-sm text-gray-600">Total Supply</p>
                    <p className="font-semibold text-gray-900">{nft.collection.totalSupply}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price History */}
          {sales && sales.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <TrendingUp className="h-5 w-5" />
                Price History
              </h3>
              <div className="space-y-3">
                {sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-900">{formatUSDC(sale.price)}</p>
                      <p className="text-sm text-gray-600">
                        {formatRelativeTime(sale.timestamp)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-600">From</p>
                      <Link
                        href={getProfileUrl(sale.seller)}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {truncateAddress(sale.seller)}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Token Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Contract Address</span>
                <Link
                  href={`https://testnet.arcscan.app/address/${nft.collection.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                >
                  {truncateAddress(nft.collection.id as Address)}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token ID</span>
                <span className="font-medium">{nft.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Standard</span>
                <span className="font-medium">ERC-721</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blockchain</span>
                <span className="font-medium">Arc Testnet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
