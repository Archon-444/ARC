/**
 * NFT Grid Component
 *
 * Responsive grid layout for displaying NFTs
 * Supports loading states, empty states, and custom actions
 */

'use client';

import { NFTCard } from './NFTCard';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUpVariants } from '@/lib/animations';
import { EmptyState } from '@/components/ui/EmptyState';
import { Package } from 'lucide-react';
import type { NFT, Listing, Auction } from '@/types';


interface NFTGridProps {
  nfts: NFT[];
  listings?: Record<string, Listing>;
  auctions?: Record<string, Auction>;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
}

export function NFTGrid({
  nfts,
  isLoading = false,
  emptyMessage = 'No NFTs found',
  emptyAction
}: NFTGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-shimmer aspect-square rounded-2xl bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No NFTs Found"
        description={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {nfts.map((nft, index) => (
        <motion.div
          key={`${nft.collection.id}-${nft.tokenId}`}
          variants={fadeInUpVariants}
          custom={index}
        >
          <NFTCard nft={nft} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Compact NFT Grid
 * Smaller grid for sidebars or compact views
 */
export function CompactNFTGrid({ nfts, isLoading, emptyMessage }: NFTGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-shimmer aspect-square rounded-lg bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="mb-2 h-12 w-12 text-gray-400" />
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {nfts.map((nft) => (
        <NFTCard key={`${nft.collection.id}-${nft.tokenId}`} nft={nft} />
      ))}
    </div>
  );
}

/**
 * Virtualized NFT Grid
 * For large lists - placeholder for future implementation with react-window
 */
export function VirtualizedNFTGrid({ nfts, ...props }: NFTGridProps) {
  // TODO: Implement with react-window or react-virtuoso for large lists
  return <NFTGrid nfts={nfts} {...props} />;
}
