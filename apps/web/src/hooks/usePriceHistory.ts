'use client';

/**
 * React Query hook for the api.priceHistory service module.
 * Named usePriceHistoryFromAPI to avoid conflict with the existing usePriceChange hook.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { PriceHistoryData } from '@/services/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const priceHistoryKeys = {
  all: ['priceHistory'] as const,
  detail: (nftId: string, period: string) =>
    ['priceHistory', nftId, period] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetch price history for a specific NFT over a given period.
 * Returns price points, current/high/low prices, and price change data.
 */
export function usePriceHistoryFromAPI(
  nftId: string,
  period: '7D' | '30D' | '90D' | '1Y' | 'All' = '30D'
) {
  return useQuery<PriceHistoryData>({
    queryKey: priceHistoryKeys.detail(nftId, period),
    queryFn: () => api.priceHistory.get(nftId, period),
    enabled: !!nftId,
    staleTime: 30_000,
  });
}
