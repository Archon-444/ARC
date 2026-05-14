'use client';

import { useQuery } from '@tanstack/react-query';

interface NFTMetadata {
  name?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export function useNFTMetadata(collectionAddress: string, tokenId: string) {
  return useQuery({
    queryKey: ['nft-metadata', collectionAddress, tokenId],
    queryFn: async () => {
      const response = await fetch(`/api/nft-metadata/${collectionAddress}/${tokenId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }
      return response.json() as Promise<NFTMetadata>;
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });
}
