'use client';

/**
 * React Query hooks for the api.offers service module.
 * Provides query hooks for listing offers and mutation hooks for create/accept/cancel.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Offer, OfferData } from '@/services/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const offerKeys = {
  all: ['offers'] as const,
  list: (nftId: string) => ['offers', nftId] as const,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch offers for a specific NFT, optionally filtered by status.
 */
export function useOffersList(
  nftId: string,
  status?: 'active' | 'accepted' | 'cancelled' | 'expired'
) {
  return useQuery<Offer[]>({
    queryKey: [...offerKeys.list(nftId), status],
    queryFn: () => api.offers.list(nftId, status),
    enabled: !!nftId,
    staleTime: 15_000,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new offer on an NFT.
 * Automatically invalidates the offer list for the target NFT on success.
 */
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, token }: { data: OfferData; token: string }) =>
      api.offers.create(data, token),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: offerKeys.list(variables.data.nftId),
      });
    },
  });
}

/**
 * Accept an existing offer.
 * Callers should manually invalidate relevant queries after success
 * since the offerId alone doesn't map to a specific nftId query key.
 */
export function useAcceptOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, token }: { offerId: string; token: string }) =>
      api.offers.accept(offerId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

/**
 * Cancel an existing offer.
 * Callers should manually invalidate relevant queries after success
 * since the offerId alone doesn't map to a specific nftId query key.
 */
export function useCancelOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, token }: { offerId: string; token: string }) =>
      api.offers.cancel(offerId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}
