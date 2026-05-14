/**
 * VirtualizedNFTGrid Component
 *
 * High-performance NFT grid using react-virtuoso for large collections (10k+ items)
 * Only renders visible items for optimal performance
 */

'use client';

import { useRef, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { NFTCard, NFTCardSkeleton } from './NFTCard';
import type { NFT, Listing, Auction } from '@/types';

export interface VirtualizedNFTGridProps {
  nfts: NFT[];
  listings?: Record<string, Listing>;
  auctions?: Record<string, Auction>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onEndReached?: () => void;
  hasMore?: boolean;
  columns?: 2 | 3 | 4 | 5;
}

export function VirtualizedNFTGrid({
  nfts,
  listings = {},
  auctions = {},
  isLoading = false,
  emptyMessage = 'No NFTs found',
  className = '',
  onEndReached,
  hasMore = false,
  columns = 4,
}: VirtualizedNFTGridProps) {
  const virtuosoRef = useRef<any>(null);

  // Calculate how many items per row based on columns
  const itemsPerRow = columns;

  // Group NFTs into rows for grid layout
  const rows = useMemo(() => {
    const result: NFT[][] = [];
    for (let i = 0; i < nfts.length; i += itemsPerRow) {
      result.push(nfts.slice(i, i + itemsPerRow));
    }
    return result;
  }, [nfts, itemsPerRow]);

  // Loading state
  if (isLoading && nfts.length === 0) {
    return (
      <div className={`grid gap-6 ${getGridClass(columns)} ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <NFTCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (nfts.length === 0 && !isLoading) {
    return (
      <div className={`flex min-h-[400px] items-center justify-center text-center ${className}`}>
        <div>
          <p className="text-lg text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
          <p className="mt-2 text-sm text-neutral-400">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Virtuoso
        ref={virtuosoRef}
        data={rows}
        endReached={hasMore ? onEndReached : undefined}
        overscan={200}
        itemContent={(index, row) => (
          <div
            key={index}
            className={`grid gap-6 ${getGridClass(columns)} mb-6`}
          >
            {row.map((nft) => {
              const nftId = `${nft.collection.id}-${nft.tokenId}`;
              const listing = listings[nftId];
              const auction = auctions[nftId];

              return (
                <NFTCard
                  key={nftId}
                  nft={nft}
                  listing={listing}
                  auction={auction}
                />
              );
            })}
            {/* Fill empty slots in the last row */}
            {row.length < itemsPerRow &&
              Array.from({ length: itemsPerRow - row.length }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
          </div>
        )}
        components={{
          Footer: () => {
            if (isLoading && nfts.length > 0) {
              return (
                <div className={`grid gap-6 ${getGridClass(columns)} mb-6`}>
                  {Array.from({ length: itemsPerRow }).map((_, i) => (
                    <NFTCardSkeleton key={i} />
                  ))}
                </div>
              );
            }
            if (!hasMore && nfts.length > 0) {
              return (
                <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  You've reached the end
                </div>
              );
            }
            return null;
          },
        }}
      />
    </div>
  );
}

function getGridClass(columns: number): string {
  const gridClasses: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };
  return gridClasses[columns] || gridClasses[4];
}
