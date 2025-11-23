/**
 * NFTDetailLayout Component
 *
 * Complete layout for NFT detail pages matching OpenSea's design
 * Two-column responsive layout with image viewer and comprehensive info panel
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, gql } from 'urql';
import {
  ExternalLink,
  RefreshCw,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  Heart,
  Flag,
  Maximize2,
} from 'lucide-react';
import { cn, formatUSDC, truncateAddress, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { PropertyGrid } from '@/components/nft/PropertyBadge';
import type { NFT, Listing, Auction } from '@/types';

const NFT_QUERY = gql`
  query GetNFTDetails($tokenId: String!) {
    token(id: $tokenId) {
      id
      tokenId
      uri
      owner {
        id
      }
      activeListing {
        id
        price
        seller {
          id
        }
      }
      activeAuction {
        id
        startingPrice
        highestBid
        endTime
        highestBidder {
          id
        }
      }
      collection {
        id
        name
        symbol
        floorPrice
      }
    }
  }
`;

export interface NFTDetailProps {
  nft: NFT; // Fallback/Initial data
  contractAddress: string;
  tokenId: string;
  onBuy?: () => void;
  onMakeOffer?: () => void;
  className?: string;
}

export function NFTDetailLayout({
  nft: initialNft,
  contractAddress,
  tokenId,
  onBuy,
  onMakeOffer,
  className,
}: NFTDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  // Fetch real-time data from Subgraph
  const [result] = useQuery({
    query: NFT_QUERY,
    variables: { tokenId: `${contractAddress}-${tokenId}` },
    pause: !contractAddress || !tokenId,
  });

  const { data, fetching, error } = result;

  // Merge initial data with real-time data
  const nftDisplay = {
    ...initialNft,
    owner: data?.token?.owner?.id || initialNft.owner,
    collection: {
      ...initialNft.collection,
      floorPrice: data?.token?.collection?.floorPrice || initialNft.collection.floorPrice,
    }
  };

  const activeListing = data?.token?.activeListing;
  const activeAuction = data?.token?.activeAuction;

  const price = activeListing?.price || activeAuction?.highestBid || activeAuction?.startingPrice;
  const priceLabel = activeAuction
    ? activeAuction.highestBid && activeAuction.highestBid !== '0'
      ? 'Current Bid'
      : 'Minimum Bid'
    : 'Current Price';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: nftDisplay.name || `NFT #${nftDisplay.tokenId}`,
          text: nftDisplay.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  const handleRefreshMetadata = () => {
    // Trigger metadata refresh
    console.log('Refreshing metadata...');
  };

  return (
    <div className={cn('mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8', className)}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link
          href="/"
          className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Home
        </Link>
        <span className="text-neutral-300 dark:text-neutral-700">/</span>
        <Link
          href={`/collection/${nftDisplay.collection.id}`}
          className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          {nftDisplay.collection.name}
        </Link>
        <span className="text-neutral-300 dark:text-neutral-700">/</span>
        <span className="font-medium text-neutral-900 dark:text-white">
          {nftDisplay.name || `#${nftDisplay.tokenId}`}
        </span>
      </nav>

      {/* Main Content - Two Column Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - Image Viewer */}
        <div className="space-y-4">
          <div className="sticky top-6">
            {/* Image Container */}
            <div className="group relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
              {!imageError ? (
                <Image
                  src={nftDisplay.image}
                  alt={nftDisplay.name || `NFT #${nftDisplay.tokenId}`}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
                  <span className="text-6xl font-bold text-neutral-400">#{nftDisplay.tokenId}</span>
                </div>
              )}

              {/* Image Controls - Show on hover */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute bottom-4 right-4 flex gap-2"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefreshMetadata}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-900"
                  aria-label="Refresh metadata"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsImageFullscreen(true)}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-900"
                  aria-label="View fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            {/* Collection Info Below Image */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="h-12 w-12 overflow-hidden rounded-lg">
                {nftDisplay.collection.image ? (
                  <Image
                    src={nftDisplay.collection.image}
                    alt={nftDisplay.collection.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/collection/${nftDisplay.collection.id}`}
                  className="block text-sm font-semibold text-neutral-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                >
                  {nftDisplay.collection.name}
                </Link>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">View collection</p>
              </div>
              {(nftDisplay.collection as any).verified && (
                <Badge variant="success" className="gap-1">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Info Panel */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="mb-2 flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white md:text-4xl">
                {nftDisplay.name || `#${nftDisplay.tokenId}`}
              </h1>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart className={cn('h-5 w-5', isLiked && 'fill-red-500 text-red-500')} />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare} aria-label="Share">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="More options">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Owner */}
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span>Owned by</span>
              <Link
                href={`/profile/${nftDisplay.owner}`}
                className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {truncateAddress(nftDisplay.owner)}
              </Link>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            {fetching ? (
              <div className="h-24 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            ) : price ? (
              <>
                <div className="mb-4">
                  <p className="mb-1 text-sm text-neutral-500 dark:text-neutral-400">{priceLabel}</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                      {formatUSDC(BigInt(price))}
                    </span>
                    <span className="text-lg text-neutral-500">USDC</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {activeListing && onBuy && (
                    <Button size="lg" fullWidth onClick={onBuy} className="flex-1">
                      Buy Now
                    </Button>
                  )}
                  {onMakeOffer && (
                    <Button
                      variant={activeListing ? 'outline' : 'primary'}
                      size="lg"
                      fullWidth
                      onClick={onMakeOffer}
                      className="flex-1"
                    >
                      Make Offer
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="mb-4 text-neutral-500">Not listed for sale</p>
                {onMakeOffer && (
                  <Button size="lg" fullWidth onClick={onMakeOffer}>
                    Make Offer
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="details" className="space-y-6">
            <Tabs.List className="w-full">
              <Tabs.Trigger value="details">Details</Tabs.Trigger>
              <Tabs.Trigger value="offers">Offers</Tabs.Trigger>
              <Tabs.Trigger value="price-history">Price History</Tabs.Trigger>
              <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
            </Tabs.List>

            {/* Details Tab */}
            <Tabs.Content value="details" className="space-y-6">
              {/* Description */}
              {nftDisplay.description && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
                    Description
                  </h3>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      {showFullDescription || nftDisplay.description.length <= 200
                        ? nftDisplay.description
                        : `${nftDisplay.description.slice(0, 200)}...`}
                    </p>
                    {nftDisplay.description.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        {showFullDescription ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Properties */}
              {nftDisplay.attributes && nftDisplay.attributes.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
                    Properties
                  </h3>
                  <PropertyGrid
                    properties={nftDisplay.attributes.map((attr) => {
                      const attribute = attr as any;
                      return {
                        traitType: attribute.trait_type,
                        value: String(attribute.value),
                        rarity: Number(attribute.rarity),
                        count: Number(attribute.count),
                      };
                    })}
                    total={Number(nftDisplay.collection.totalSupply)}
                  />
                </div>
              )}

              {/* Contract Details */}
              <div>
                <h3 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-white">
                  Details
                </h3>
                <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                  <DetailRow label="Contract Address" value={truncateAddress(nftDisplay.collection.id)}>
                    <a
                      href={`https://arcscan.com/address/${nftDisplay.collection.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </DetailRow>
                  <DetailRow label="Token ID" value={nftDisplay.tokenId} />
                  <DetailRow label="Token Standard" value="ERC-721" />
                  <DetailRow label="Chain" value="Arc Testnet" />
                  <DetailRow
                    label="Metadata"
                    value={(nftDisplay as any).uri ? 'Centralized' : 'Frozen'}
                  />
                </div>
              </div>
            </Tabs.Content>

            {/* Offers Tab */}
            <Tabs.Content value="offers">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                <p className="text-neutral-500 dark:text-neutral-400">No offers yet</p>
                <p className="mt-2 text-sm text-neutral-400">Be the first to make an offer!</p>
              </div>
            </Tabs.Content>

            {/* Price History Tab */}
            <Tabs.Content value="price-history">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                <p className="text-neutral-500 dark:text-neutral-400">No price history</p>
                <p className="mt-2 text-sm text-neutral-400">
                  Price history will appear after the first sale
                </p>
              </div>
            </Tabs.Content>

            {/* Activity Tab */}
            <Tabs.Content value="activity">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
                <p className="text-neutral-500 dark:text-neutral-400">No activity yet</p>
              </div>
            </Tabs.Content>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  children?: React.ReactNode;
}

function DetailRow({ label, value, children }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
        {children}
      </div>
    </div>
  );
}
