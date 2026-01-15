'use client';

import { useQuery } from '@tanstack/react-query';
import type { NFTWithRarity } from '@/lib/rarity/calculator';

interface UseRarityDataOptions {
  collectionAddress: string;
  enabled?: boolean;
}

export function useRarityData({ collectionAddress, enabled = true }: UseRarityDataOptions) {
  return useQuery({
    queryKey: ['rarity', collectionAddress],
    queryFn: async () => {
      const response = await fetch(`/api/rarity/${collectionAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rarity data');
      }
      const data = await response.json();
      return data.rarityData as NFTWithRarity[];
    },
    enabled: enabled && !!collectionAddress,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useNFTRarity(collectionAddress: string, tokenId: string) {
  const { data: rarityData, isLoading } = useRarityData({ collectionAddress, enabled: true });
  const nftRarity = rarityData?.find((nft) => nft.tokenId === tokenId);

  return {
    rarity: nftRarity,
    isLoading,
  };
}
'use client';

import { useQuery } from '@tanstack/react-query';
import { NFTWithRarity } from '@/lib/rarity/calculator';

interface UseRarityDataOptions {
  collectionAddress: string;
  enabled?: boolean;
}

export function useRarityData({ collectionAddress, enabled = true }: UseRarityDataOptions) {
  return useQuery({
    queryKey: ['rarity', collectionAddress],
    queryFn: async () => {
      const response = await fetch(`/api/rarity/${collectionAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rarity data');
      }
      const data = await response.json();
      return data.rarityData as NFTWithRarity[];
    },
    enabled: enabled && !!collectionAddress,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  });
}

export function useNFTRarity(collectionAddress: string, tokenId: string) {
  const { data: rarityData, isLoading } = useRarityData({ collectionAddress });
  const nftRarity = rarityData?.find((nft) => nft.tokenId === tokenId);

  return {
    rarity: nftRarity,
    isLoading,
  };
}
