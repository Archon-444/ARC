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
import { MakeOfferModal, OfferData } from '@/components/marketplace/MakeOfferModal';
import { createOffer } from '@/lib/api';
import { useCircleWallet } from '@/providers/CircleWalletProvider';
import { ActivityTable } from '@/components/collection/ActivityTable';
import { RarityBadge } from '@/components/nft/RarityBadge';
import { TraitRarityTable } from '@/components/nft/TraitRarityTable';
import { PriceHistoryChart } from '@/components/nft/PriceHistoryChart';
import { SimilarItemsCarousel } from '@/components/nft/SimilarItemsCarousel';
import { AttributeCard } from '@/components/nft/AttributeCard';
import { fetchNFTDetails } from '@/lib/graphql-client';
import {
  formatUSDC,
  formatTimeRemaining,
  formatRelativeTime,
  truncateAddress,
  getImageUrl,
  getCollectionUrl,
  getProfileUrl,
  cn,
  getTimeRemaining,
} from '@/lib/utils';
import type { NFT, Listing, Auction, Sale, Address } from '@/types';
import { useRarityData } from '@/hooks/useRarityData';
import { RarityCalculator } from '@/lib/rarity/calculator';
import { useNFTRarity } from '@/hooks/useRarityData';

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
  const { rarity } = useNFTRarity(collection, tokenId);
  const { data: collectionRarity } = useRarityData({ collectionAddress: collection });
  const rarityCalculator = collectionRarity ? new RarityCalculator(collectionRarity) : null;

  // Modal states
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [showCancelListingModal, setShowCancelListingModal] = useState(false);
  const [showCancelAuctionModal, setShowCancelAuctionModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const { userToken, currentWallet } = useCircleWallet();

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
                {nft.attributes.map((attr, index) => {
                  const traitRarity = rarityCalculator?.getTraitRarity({
                    trait_type: attr.trait_type,
                    value: String(attr.value),
                  });

                  return (
                    <AttributeCard
                      key={index}
                      traitType={attr.trait_type}
                      value={String(attr.value)}
                      frequency={traitRarity?.frequency}
                      showRarity
                    />
                  );
                })}
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

          {rarity && (
            <RarityBadge
              rarityTier={rarity.rarityTier}
              rarityRank={rarity.rarityRank}
              rarityPercentile={rarity.rarityPercentile}
              showRank
              size="lg"
            />
          )}

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
              {address && address.toLowerCase() !== nft.owner.toLowerCase() && (
                 <button
                    onClick={() => setShowOfferModal(true)}
                    className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Make Offer
                  </button>
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
              <PriceHistoryChart sales={sales} />
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

          {rarity && rarity.attributes && rarity.attributes.length > 0 && (
            <details className="rounded-lg border border-gray-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                Detailed Trait Analysis
              </summary>
              <div className="mt-4">
                <TraitRarityTable
                  traits={rarity.attributes}
                  collectionAddress={nft.collection.id}
                />
              </div>
            </details>
          )}
        </div>
      </div>

      <div className="mt-12 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Item Activity</h2>
          <ActivityTable collectionAddress={collection} tokenId={tokenId} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Similar Items</h2>
          <SimilarItemsCarousel collectionAddress={collection} tokenId={tokenId} />
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

      {nft && (
        <MakeOfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          nft={nft}
          floorPrice={nft.collection?.floorPrice ? BigInt(nft.collection.floorPrice) : undefined}
          currentBalance={BigInt(1000000000)} // Mock balance for UI testing if real balance unavailable
          onSubmit={async (data) => {
            if (!userToken) throw new Error('Please connect wallet');
            await createOffer(collection, tokenId, data, userToken);
            loadNFT();
          }}
        />
      )}
    </div>
  );
}
