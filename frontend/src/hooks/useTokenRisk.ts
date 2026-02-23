'use client';

import { useQuery } from '@tanstack/react-query';
import type { TokenRiskAssessment } from '@/types';

export function useTokenRisk(tokenAddress: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['token-risk', tokenAddress],
    queryFn: async () => {
      const response = await fetch(`/api/token/${tokenAddress}/risk`);
      if (!response.ok) {
        throw new Error('Failed to fetch risk assessment');
      }
      return response.json() as Promise<TokenRiskAssessment>;
    },
    enabled: !!tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress),
    staleTime: 1000 * 60 * 5, // 5 minutes (matches API cache)
    gcTime: 1000 * 60 * 15,
  });

  return {
    risk: data ?? null,
    isLoading,
    error,
  };
}
