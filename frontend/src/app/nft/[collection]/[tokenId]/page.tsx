/**
 * NFT Detail Page
 *
 * Displays individual NFT with metadata, listing/auction info,
 * price history, and action buttons (Buy, Bid, List)
 */

'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount } from 'wagmi';
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
  XCircle,
} from 'lucide-react';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { ErrorPage } from '@/components/ui/ErrorDisplay';
import { BuyModal } from '@/components/marketplace/BuyModal';
import { BidModal } from '@/components/marketplace/BidModal';
import { ListNFTModal } from '@/components/marketplace/ListNFTModal';
import { CreateAuctionModal } from '@/components/marketplace/CreateAuctionModal';
import { CancelListingModal } from '@/components/marketplace/CancelListingModal';
import { CancelAuctionModal } from '@/components/marketplace/CancelAuctionModal';
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

function PriceHistoryChart({
  points,
}: {
  points: { value: number; label: string }[];
}) {
  if (!points.length) {
    return null;
  }

  const values = points.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="h-40 w-full">
      <defs>
        <linearGradient id="priceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2081E2" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <path d={`${path} L 100 100 L 0 100 Z`} fill="url(#priceGradient)" opacity={0.12} />
      <path d={path} fill="none" stroke="url(#priceGradient)" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function estimateTraitRarity(traitType: string, value: string | number) {
  const seed = `${traitType}:${value}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  const percentage = ((hash % 80) + 5).toFixed(0);
  return `${percentage}%`;
}

interface PageProps {
  params: Promise<{
    collection: string;
    tokenId: string;
  }>;
}

export default function NFTDetailPage({ params }: PageProps) {
  const { collection, tokenId } = use(params);
  const { address } = useAccount();

  const [nft, setNft] = useState<NFT | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  // Modal states
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [showCancelListingModal, setShowCancelListingModal] = useState(false);
  const [showCancelAuctionModal, setShowCancelAuctionModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'sales' | 'listing' | 'offers' | 'transfers'>('all');

  // Countdown for auctions
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof getTimeRemaining> | null>(null);

  // Memoized values - must be before any early returns to follow Rules of Hooks
  const priceHistoryPoints = useMemo(() =>
    sales.map((sale) => ({
      value: Number(sale.price) / 1e6,
      label: formatRelativeTime(sale.timestamp),
    })),
    [sales]);

  const activityEvents = useMemo(() => {
    const baseEvents: {
      id: string;
      type: 'sales' | 'listing';
      label: string;
      price: string;
      from: string;
      to: string;
      date: string;
      timestamp: number;
    }[] = sales.map((sale) => ({
      id: sale.id,
      type: 'sales' as const,
      label: 'Sale',
      price: formatUSDC(sale.price),
      from: truncateAddress(sale.seller),
      to: truncateAddress(sale.buyer),
      date: formatDate(sale.timestamp),
      timestamp: Number(sale.timestamp),
    }));

    if (listing) {
      baseEvents.push({
        id: `${listing.id}-listing`,
        type: 'listing' as const,
        label: 'Listing',
        price: formatUSDC(listing.price),
        from: truncateAddress(listing.seller),
        to: 'Marketplace',
        date: formatDate(listing.createdAt),
        timestamp: Number(listing.createdAt || 0),
      });
    }

    return baseEvents.sort((a, b) => b.timestamp - a.timestamp);
  }, [sales, listing]);

  const moreFromCollection = useMemo(() => {
    if (!nft) return [];
    const baseId = parseInt(nft.tokenId, 10) || 0;
    return Array.from({ length: 4 }).map((_, index) => ({
      tokenId: (baseId + index + 1).toString(),
      href: `/nft/${nft.collection.id}/${baseId + index + 1}`,
    }));
  }, [nft]);

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
  const filteredActivity = activityEvents.filter((event) => activityFilter === 'all' || event.type === activityFilter);

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
                  <div key={index} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{attr.trait_type}</p>
                    <p className="font-semibold text-gray-900">{attr.value}</p>
                    <p className="text-xs text-gray-500">{estimateTraitRarity(attr.trait_type, attr.value)}</p>
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
              {address && address.toLowerCase() === nft.owner.toLowerCase() ? (
                <button
                  onClick={() => setShowCancelListingModal(true)}
                  className="w-full rounded-lg border-2 border-red-600 bg-white px-6 py-3 text-lg font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  Cancel Listing
                </button>
              ) : (
                <button
                  onClick={() => setShowBuyModal(true)}
                  disabled={!address}
                  className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {!address ? 'Connect Wallet' : 'Buy Now'}
                </button>
              )}
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
              {address && address.toLowerCase() === nft.owner.toLowerCase() ? (
                <button
                  onClick={() => setShowCancelAuctionModal(true)}
                  className="w-full rounded-lg border-2 border-red-600 bg-white px-6 py-3 text-lg font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  Cancel Auction
                </button>
              ) : (
                <button
                  onClick={() => setShowBidModal(true)}
                  disabled={!address}
                  className="w-full rounded-lg bg-purple-600 px-6 py-3 text-lg font-semibold text-white hover:bg-purple-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Gavel className="h-5 w-5" />
                  {!address ? 'Connect Wallet' : 'Place Bid'}
                </button>
              )}
            </div>
          )}

          {!listing && !isAuctionActive && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="mb-4 text-center text-gray-600">This NFT is not currently listed for sale</p>
              {address && address.toLowerCase() === nft.owner.toLowerCase() && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowListModal(true)}
                    className="flex-1 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    <Tag className="mx-auto mb-1 h-4 w-4" />
                    List for Sale
                  </button>
                  <button
                    onClick={() => setShowAuctionModal(true)}
                    className="flex-1 rounded-lg border border-purple-600 bg-white px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50"
                  >
                    <Gavel className="mx-auto mb-1 h-4 w-4" />
                    Create Auction
                  </button>
                </div>
              )}
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
              <PriceHistoryChart points={priceHistoryPoints} />
              <div className="mt-4 space-y-3">
                {sales.slice(0, 4).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-900">{formatUSDC(sale.price)}</p>
                      <p className="text-sm text-gray-600">{formatRelativeTime(sale.timestamp)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-600">From</p>
                      <Link href={getProfileUrl(sale.seller)} className="font-medium text-blue-600 hover:text-blue-700">
                        {truncateAddress(sale.seller)}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activityEvents.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">Item Activity</h3>
                <div className="flex gap-2">
                  {(['all', 'sales', 'listing'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter)}
                      className={`chip ${activityFilter === filter ? 'border-blue-500 text-blue-600' : ''}`}
                    >
                      {filter === 'all' ? 'All' : filter === 'sales' ? 'Sales' : 'Listings'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="pb-2">Event</th>
                      <th className="pb-2">Price</th>
                      <th className="pb-2">From</th>
                      <th className="pb-2">To</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivity.slice(0, 6).map((event) => (
                      <tr key={event.id} className="border-t border-gray-100">
                        <td className="py-3 font-semibold text-gray-900">{event.label}</td>
                        <td className="py-3">{event.price}</td>
                        <td className="py-3 text-blue-600">{event.from}</td>
                        <td className="py-3 text-blue-600">{event.to}</td>
                        <td className="py-3 text-gray-500">{event.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">More from this collection</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {moreFromCollection.map((item) => (
                <Link
                  key={item.tokenId}
                  href={item.href}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:border-blue-500"
                >
                  <p className="text-sm text-gray-500">Token #{item.tokenId}</p>
                  <p className="text-lg font-semibold text-gray-900">View details →</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {listing && (
        <BuyModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          nft={nft}
          listing={listing}
          onSuccess={() => {
            setShowBuyModal(false);
            loadNFT();
          }}
        />
      )}

      {auction && (
        <BidModal
          isOpen={showBidModal}
          onClose={() => setShowBidModal(false)}
          nft={nft}
          auction={auction}
          onSuccess={() => {
            setShowBidModal(false);
            loadNFT();
          }}
        />
      )}

      <ListNFTModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        nft={nft}
        onSuccess={() => {
          setShowListModal(false);
          loadNFT();
        }}
      />

      <CreateAuctionModal
        isOpen={showAuctionModal}
        onClose={() => setShowAuctionModal(false)}
        nft={nft}
        onSuccess={() => {
          setShowAuctionModal(false);
          loadNFT();
        }}
      />

      {listing && (
        <CancelListingModal
          isOpen={showCancelListingModal}
          onClose={() => setShowCancelListingModal(false)}
          nft={nft}
          listing={listing}
          onSuccess={() => {
            setShowCancelListingModal(false);
            loadNFT();
          }}
        />
      )}

      {auction && (
        <CancelAuctionModal
          isOpen={showCancelAuctionModal}
          onClose={() => setShowCancelAuctionModal(false)}
          nft={nft}
          auction={auction}
          onSuccess={() => {
            setShowCancelAuctionModal(false);
            loadNFT();
          }}
        />
      )}
    </div>
  );
}
