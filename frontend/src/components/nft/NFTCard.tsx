/**
 * NFT Card Component
 *
 * Displays NFT with image, metadata, price, and auction status
 * Used in grids throughout the marketplace
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock, Heart, Share2, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { NFT, Listing, Auction } from '@/types';
import {
  cn,
  formatUSDC,
  formatTimeRemaining,
  getNFTUrl,
  getImageUrl,
  truncateAddress,
} from '@/lib/utils';
import { Skeleton } from '@/components/ui/LoadingSpinner';

interface NFTCardProps {
  nft: NFT;
  listing?: Listing;
  auction?: Auction;
  showOwner?: boolean;
  showCollection?: boolean;
  className?: string;
  onClick?: () => void;
}

// Animation variants
const cardVariants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: {
      duration: 0.2,
    },
  },
};

const imageVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

const quickActionsVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      staggerChildren: 0.05,
    },
  },
};

const actionButtonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

export function NFTCard({
  nft,
  listing,
  auction,
  showOwner = true,
  showCollection = true,
  className,
  onClick,
}: NFTCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = getImageUrl(nft.image);
  const nftUrl = getNFTUrl(nft.collection.id, nft.tokenId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: nft.name || `NFT #${nft.tokenId}`,
        url: window.location.origin + nftUrl,
      });
    }
  };

  // Determine price to display
  const price = listing?.price || auction?.highestBid || auction?.minBid;
  const priceLabel = auction
    ? auction.highestBid && auction.highestBid !== '0'
      ? 'Current Bid'
      : 'Min Bid'
    : 'Price';

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={cardVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-neutral-200/60 bg-white dark:border-neutral-700 dark:bg-neutral-900',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      {/* Image Container */}
      <Link href={nftUrl} className="block aspect-square relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <motion.div variants={imageVariants} className="h-full w-full">
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={nft.name || `NFT #${nft.tokenId}`}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700">
              <span className="text-4xl font-bold text-neutral-400 dark:text-neutral-500">#{nft.tokenId}</span>
            </div>
          )}
        </motion.div>

        {/* Auction Badge */}
        {auction && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-3 left-3"
          >
            <div className="flex items-center gap-1 rounded-full bg-accent-600 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm">
              <Clock className="h-3 w-3" />
              Auction
            </div>
          </motion.div>
        )}

        {/* Quick Actions - Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Like Button - Always visible */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="rounded-full bg-white/90 p-2 backdrop-blur-sm shadow-sm transition-colors hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-900"
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              className={cn('h-4 w-4 transition-colors', isLiked ? 'fill-red-500 text-red-500' : 'text-neutral-600 dark:text-neutral-400')}
            />
          </motion.button>

          {/* Additional quick actions - Show on hover */}
          <motion.div
            initial="hidden"
            animate={isHovered ? 'visible' : 'hidden'}
            variants={quickActionsVariants}
            className="flex flex-col gap-2"
          >
            <motion.button
              variants={actionButtonVariants}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="rounded-full bg-white/90 p-2 backdrop-blur-sm shadow-sm transition-colors hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-900"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </motion.button>

            <motion.button
              variants={actionButtonVariants}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // More actions menu
              }}
              className="rounded-full bg-white/90 p-2 backdrop-blur-sm shadow-sm transition-colors hover:bg-white dark:bg-neutral-900/90 dark:hover:bg-neutral-900"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            </motion.button>
          </motion.div>
        </div>

        {/* Auction Time Remaining Overlay */}
        {auction && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-2 text-white">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{formatTimeRemaining(auction.endTime)}</span>
            </div>
          </div>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4">
        {/* Collection Name */}
        {showCollection && nft.collection?.name && (
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-neutral-400 truncate">
            {nft.collection.name}
          </p>
        )}

        {/* NFT Name */}
        <Link href={nftUrl}>
          <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white truncate hover:text-primary-600 dark:hover:text-primary-400">
            {nft.name || `#${nft.tokenId}`}
          </h3>
        </Link>

        {/* Owner */}
        {showOwner && (
          <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">
            Owner: <span className="font-medium">{truncateAddress(nft.owner)}</span>
          </p>
        )}

        {/* Price Section */}
        {price && (
          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-700 pt-3">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{priceLabel}</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">{formatUSDC(price)}</p>
            </div>
            {listing && (
              <Link
                href={nftUrl}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Buy Now
              </Link>
            )}
            {auction && (
              <Link
                href={nftUrl}
                className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Place Bid
              </Link>
            )}
          </div>
        )}

        {/* No Listing State */}
        {!price && (
          <div className="border-t border-neutral-100 dark:border-neutral-700 pt-3">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Not listed</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Compact NFT Card for lists/tables
 */
export function NFTCardCompact({ nft, listing, auction }: NFTCardProps) {
  const imageUrl = getImageUrl(nft.image);
  const nftUrl = getNFTUrl(nft.collection.id, nft.tokenId);
  const price = listing?.price || auction?.highestBid;

  return (
    <Link
      href={nftUrl}
      className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-all hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
    >
      {/* Image */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={imageUrl}
          alt={nft.name || `NFT #${nft.tokenId}`}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{nft.collection.name}</p>
        <p className="font-semibold text-neutral-900 dark:text-white truncate">{nft.name || `#${nft.tokenId}`}</p>
        {price && <p className="text-sm text-neutral-600 dark:text-neutral-400">{formatUSDC(price)}</p>}
      </div>

      {/* Badge */}
      {auction && (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-1 text-xs font-medium text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
            <Clock className="h-3 w-3" />
            Auction
          </span>
        </div>
      )}
    </Link>
  );
}

/**
 * NFT Card Skeleton for loading states
 */
export function NFTCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="border-t border-neutral-100 dark:border-neutral-700 pt-3">
          <Skeleton className="h-3 w-1/3 mb-1" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of NFT Cards with loading state
 */
export function NFTGrid({
  nfts,
  listings,
  auctions,
  isLoading,
  emptyMessage = 'No NFTs found',
  className,
}: {
  nfts?: NFT[];
  listings?: Record<string, Listing>;
  auctions?: Record<string, Auction>;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <NFTCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-center">
        {typeof emptyMessage === 'string' ? (
          <p className="text-gray-500 dark:text-neutral-400">{emptyMessage}</p>
        ) : (
          emptyMessage
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {nfts.map((nft) => {
        const nftId = `${nft.collection.id}-${nft.tokenId}`;
        const listing = listings?.[nftId];
        const auction = auctions?.[nftId];

        return <NFTCard key={nftId} nft={nft} listing={listing} auction={auction} />;
      })}
    </div>
  );
}
