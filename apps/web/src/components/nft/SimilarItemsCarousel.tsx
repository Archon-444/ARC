'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRarityData } from '@/hooks/useRarityData';
import { getImageUrl, getNFTUrl } from '@/lib/utils';

type SimilarItemsCarouselProps = {
  collectionAddress: string;
  tokenId: string;
};

export function SimilarItemsCarousel({ collectionAddress, tokenId }: SimilarItemsCarouselProps) {
  const { data: rarityData } = useRarityData({ collectionAddress });

  const items = useMemo(() => {
    if (!rarityData || rarityData.length === 0) return [];
    const currentIndex = rarityData.findIndex((item) => item.tokenId === tokenId);
    if (currentIndex === -1) return rarityData.slice(0, 6);
    const start = Math.max(currentIndex - 3, 0);
    return rarityData.slice(start, start + 6);
  }, [rarityData, tokenId]);

  if (items.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Similar items will appear once rarity data is available.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {items.map((item) => (
        <Link
          key={item.tokenId}
          href={getNFTUrl(collectionAddress, item.tokenId)}
          className="min-w-[160px] rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm"
        >
          <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-100">
            {item.image ? (
              <img
                src={getImageUrl(item.image)}
                alt={item.name || `NFT #${item.tokenId}`}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="mt-2 text-sm font-medium text-gray-900 truncate">
            {item.name || `#${item.tokenId}`}
          </div>
          <div className="text-xs text-gray-500">Rank #{item.rarityRank}</div>
        </Link>
      ))}
    </div>
  );
}
