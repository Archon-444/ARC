'use client';

/**
 * React Query hooks for the GraphQL subgraph client.
 * Wraps all graphql-client.ts exports with caching and query key management.
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchListings,
  fetchAuctions,
  fetchMarketplaceStats,
  fetchNFTDetails,
  fetchUserActivity,
  fetchLaunchedTokens,
  fetchTokenDetail,
  fetchTokenTrades,
  fetchCreatorTokens,
  fetchTokenTradeMetrics,
  fetchCreatorWithdrawals,
  fetchTokenLauncherStats,
} from '@/lib/graphql-client';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const subgraphKeys = {
  // Marketplace
  listings: (params: Record<string, unknown>) =>
    ['subgraph', 'listings', params] as const,
  auctions: (params: Record<string, unknown>) =>
    ['subgraph', 'auctions', params] as const,
  marketplaceStats: ['subgraph', 'marketplaceStats'] as const,
  nftDetails: (collection: string, tokenId: string) =>
    ['subgraph', 'nft', collection, tokenId] as const,
  userActivity: (address: string) =>
    ['subgraph', 'userActivity', address] as const,

  // Token Launcher
  launchedTokens: (params: Record<string, unknown>) =>
    ['subgraph', 'launchedTokens', params] as const,
  tokenDetail: (address: string) =>
    ['subgraph', 'tokenDetail', address] as const,
  tokenTrades: (address: string, params: Record<string, unknown>) =>
    ['subgraph', 'tokenTrades', address, params] as const,
  creatorTokens: (address: string) =>
    ['subgraph', 'creatorTokens', address] as const,
  tokenTradeMetrics: (address: string) =>
    ['subgraph', 'tokenTradeMetrics', address] as const,
  creatorWithdrawals: (address: string) =>
    ['subgraph', 'creatorWithdrawals', address] as const,
  tokenLauncherStats: ['subgraph', 'tokenLauncherStats'] as const,
};

// ============================================================================
// MARKETPLACE HOOKS
// ============================================================================

/**
 * Fetch active marketplace listings with pagination and sorting.
 */
export function useListingsQuery(
  params: Parameters<typeof fetchListings>[0]
) {
  return useQuery({
    queryKey: subgraphKeys.listings(params),
    queryFn: () => fetchListings(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch active auctions with pagination.
 */
export function useAuctionsQuery(
  params: Parameters<typeof fetchAuctions>[0]
) {
  return useQuery({
    queryKey: subgraphKeys.auctions(params),
    queryFn: () => fetchAuctions(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch the latest marketplace daily snapshot stats.
 */
export function useMarketplaceStatsQuery() {
  return useQuery({
    queryKey: subgraphKeys.marketplaceStats,
    queryFn: fetchMarketplaceStats,
    staleTime: 60_000,
  });
}

/**
 * Fetch detailed information for a single NFT including listings, auctions, and sales.
 */
export function useNFTDetailsQuery(collection: string, tokenId: string) {
  return useQuery({
    queryKey: subgraphKeys.nftDetails(collection, tokenId),
    queryFn: () => fetchNFTDetails(collection, tokenId),
    enabled: !!collection && !!tokenId,
    staleTime: 30_000,
  });
}

/**
 * Fetch a user's activity: listings, bids, and purchases.
 */
export function useUserActivityQuery(address: string) {
  return useQuery({
    queryKey: subgraphKeys.userActivity(address),
    queryFn: () => fetchUserActivity(address),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ============================================================================
// TOKEN LAUNCHER HOOKS
// ============================================================================

/**
 * Fetch launched tokens with pagination, sorting, and optional graduation filter.
 */
export function useLaunchedTokensQuery(
  params: Parameters<typeof fetchLaunchedTokens>[0]
) {
  return useQuery({
    queryKey: subgraphKeys.launchedTokens(params),
    queryFn: () => fetchLaunchedTokens(params),
    staleTime: 30_000,
  });
}

/**
 * Fetch a single token's detail including recent trades and stakes.
 */
export function useTokenDetailQuery(tokenAddress: string) {
  return useQuery({
    queryKey: subgraphKeys.tokenDetail(tokenAddress),
    queryFn: () => fetchTokenDetail(tokenAddress),
    enabled: !!tokenAddress,
    staleTime: 15_000,
  });
}

/**
 * Fetch paginated trade history for a specific token.
 */
export function useTokenTradesQuery(
  tokenAddress: string,
  params: Parameters<typeof fetchTokenTrades>[1]
) {
  return useQuery({
    queryKey: subgraphKeys.tokenTrades(tokenAddress, params),
    queryFn: () => fetchTokenTrades(tokenAddress, params),
    enabled: !!tokenAddress,
    staleTime: 15_000,
  });
}

/**
 * Fetch all tokens launched by a specific creator address.
 */
export function useCreatorTokensQuery(creatorAddress: string) {
  return useQuery({
    queryKey: subgraphKeys.creatorTokens(creatorAddress),
    queryFn: () => fetchCreatorTokens(creatorAddress),
    enabled: !!creatorAddress,
    staleTime: 60_000,
  });
}

/**
 * Fetch buy/sell trade metrics for a token (used for risk scoring).
 */
export function useTokenTradeMetricsQuery(tokenAddress: string) {
  return useQuery({
    queryKey: subgraphKeys.tokenTradeMetrics(tokenAddress),
    queryFn: () => fetchTokenTradeMetrics(tokenAddress),
    enabled: !!tokenAddress,
    staleTime: 30_000,
  });
}

/**
 * Fetch creator withdrawal history for a token (used for rug-pull detection).
 */
export function useCreatorWithdrawalsQuery(tokenAddress: string) {
  return useQuery({
    queryKey: subgraphKeys.creatorWithdrawals(tokenAddress),
    queryFn: () => fetchCreatorWithdrawals(tokenAddress),
    enabled: !!tokenAddress,
    staleTime: 60_000,
  });
}

/**
 * Fetch global token launcher statistics.
 */
export function useTokenLauncherStatsQuery() {
  return useQuery({
    queryKey: subgraphKeys.tokenLauncherStats,
    queryFn: fetchTokenLauncherStats,
    staleTime: 60_000,
  });
}
