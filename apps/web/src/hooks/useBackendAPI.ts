/**
 * React Query Hooks for Backend API Integration
 * Provides custom hooks for all Express backend endpoints
 *
 * NOTE: These hooks use generic backend endpoints (e.g., /tokens, /nfts, /activities)
 * via the HTTPClient's get/post methods. For the more structured service module hooks
 * (api.search.*, api.analytics.*, api.offers.*, etc.), see:
 * - useAnalytics.ts
 * - usePriceHistory.ts
 * - useOffers.ts
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

// Types for API responses
interface Token {
  id: string;
  name: string;
  symbol: string;
  address: string;
  creator: string;
  supply: string;
  price: string;
  createdAt: string;
}

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  owner: string;
  price?: string;
  listed: boolean;
}

interface Activity {
  id: string;
  type: 'token_created' | 'nft_minted' | 'trade' | 'listing';
  user: string;
  data: any;
  timestamp: string;
}

// Query Keys
export const queryKeys = {
  tokens: ['tokens'] as const,
  token: (id: string) => ['token', id] as const,
  nfts: ['nfts'] as const,
  nft: (id: string) => ['nft', id] as const,
  activities: ['activities'] as const,
  userTokens: (address: string) => ['userTokens', address] as const,
  userNFTs: (address: string) => ['userNFTs', address] as const,
};

// Token Hooks
export function useTokens(options?: UseQueryOptions<Token[]>) {
  return useQuery<Token[]>({
    queryKey: queryKeys.tokens,
    queryFn: () => apiClient.get<Token[]>('/tokens'),
    ...options,
  });
}

export function useToken(tokenId: string, options?: UseQueryOptions<Token>) {
  return useQuery<Token>({
    queryKey: queryKeys.token(tokenId),
    queryFn: () => apiClient.get<Token>(`/tokens/${tokenId}`),
    enabled: !!tokenId,
    ...options,
  });
}

export function useCreateToken(options?: UseMutationOptions<Token, Error, Partial<Token>>) {
  const queryClient = useQueryClient();

  return useMutation<Token, Error, Partial<Token>>({
    mutationFn: (tokenData) => apiClient.post<Token>('/tokens', tokenData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tokens });
    },
    ...options,
  });
}

// NFT Hooks
export function useNFTs(options?: UseQueryOptions<NFT[]>) {
  return useQuery<NFT[]>({
    queryKey: queryKeys.nfts,
    queryFn: () => apiClient.get<NFT[]>('/nfts'),
    ...options,
  });
}

export function useNFT(nftId: string, options?: UseQueryOptions<NFT>) {
  return useQuery<NFT>({
    queryKey: queryKeys.nft(nftId),
    queryFn: () => apiClient.get<NFT>(`/nfts/${nftId}`),
    enabled: !!nftId,
    ...options,
  });
}

export function useMintNFT(options?: UseMutationOptions<NFT, Error, Partial<NFT>>) {
  const queryClient = useQueryClient();

  return useMutation<NFT, Error, Partial<NFT>>({
    mutationFn: (nftData) => apiClient.post<NFT>('/nfts', nftData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nfts });
    },
    ...options,
  });
}

export function useListNFT(options?: UseMutationOptions<NFT, Error, { nftId: string; price: string }>) {
  const queryClient = useQueryClient();

  return useMutation<NFT, Error, { nftId: string; price: string }>({
    mutationFn: ({ nftId, price }) => apiClient.post<NFT>(`/nfts/${nftId}/list`, { price }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nft(variables.nftId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nfts });
    },
    ...options,
  });
}

// Activity Hooks
export function useActivities(options?: UseQueryOptions<Activity[]>) {
  return useQuery<Activity[]>({
    queryKey: queryKeys.activities,
    queryFn: () => apiClient.get<Activity[]>('/activities'),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time feel
    ...options,
  });
}

// User-specific Hooks
export function useUserTokens(userAddress: string, options?: UseQueryOptions<Token[]>) {
  return useQuery<Token[]>({
    queryKey: queryKeys.userTokens(userAddress),
    queryFn: () => apiClient.get<Token[]>(`/users/${userAddress}/tokens`),
    enabled: !!userAddress,
    ...options,
  });
}

export function useUserNFTs(userAddress: string, options?: UseQueryOptions<NFT[]>) {
  return useQuery<NFT[]>({
    queryKey: queryKeys.userNFTs(userAddress),
    queryFn: () => apiClient.get<NFT[]>(`/users/${userAddress}/nfts`),
    enabled: !!userAddress,
    ...options,
  });
}
