'use client';

/**
 * React Query hooks for the api.analytics service module.
 * Wraps all analytics endpoints with caching, automatic refetching, and query key management.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type {
  VolumeDataPoint,
  SalesDistribution,
  HolderDistribution,
  TopSale,
  AnalyticsData,
} from '@/services/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const analyticsKeys = {
  all: ['analytics'] as const,
  volume: (collectionId: string, period: string) =>
    ['analytics', 'volume', collectionId, period] as const,
  salesDistribution: (collectionId: string) =>
    ['analytics', 'salesDistribution', collectionId] as const,
  holderStats: (collectionId: string) =>
    ['analytics', 'holderStats', collectionId] as const,
  topSales: (collectionId: string) =>
    ['analytics', 'topSales', collectionId] as const,
  collection: (collectionId: string, period: string) =>
    ['analytics', 'collection', collectionId, period] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetch volume data for a collection over a given period.
 */
export function useVolume(
  collectionId: string,
  period: '7D' | '30D' | '90D' | '1Y' | 'All' = '30D'
) {
  return useQuery<VolumeDataPoint[]>({
    queryKey: analyticsKeys.volume(collectionId, period),
    queryFn: () => api.analytics.getVolume(collectionId, period),
    enabled: !!collectionId,
    staleTime: 60_000,
  });
}

/**
 * Fetch sales distribution breakdown for a collection.
 */
export function useSalesDistribution(collectionId: string) {
  return useQuery<SalesDistribution[]>({
    queryKey: analyticsKeys.salesDistribution(collectionId),
    queryFn: () => api.analytics.getSalesDistribution(collectionId),
    enabled: !!collectionId,
    staleTime: 60_000,
  });
}

/**
 * Fetch holder distribution stats for a collection.
 */
export function useHolderStats(collectionId: string) {
  return useQuery<HolderDistribution[]>({
    queryKey: analyticsKeys.holderStats(collectionId),
    queryFn: () => api.analytics.getHolderStats(collectionId),
    enabled: !!collectionId,
    staleTime: 60_000,
  });
}

/**
 * Fetch top sales for a collection.
 */
export function useTopSales(collectionId: string, limit = 10) {
  return useQuery<TopSale[]>({
    queryKey: analyticsKeys.topSales(collectionId),
    queryFn: () => api.analytics.getTopSales(collectionId, limit),
    enabled: !!collectionId,
    staleTime: 60_000,
  });
}

/**
 * Fetch comprehensive analytics for a collection (volume, sales distribution,
 * holder stats, and top sales aggregated into a single response).
 */
export function useCollectionAnalytics(
  collectionId: string,
  period: '7D' | '30D' | '90D' | '1Y' | 'All' = '30D'
) {
  return useQuery<AnalyticsData>({
    queryKey: analyticsKeys.collection(collectionId, period),
    queryFn: () => api.analytics.getCollectionAnalytics(collectionId, period),
    enabled: !!collectionId,
    staleTime: 60_000,
  });
}
