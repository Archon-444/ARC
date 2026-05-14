'use client';

import { useQuery } from '@tanstack/react-query';

export function usePriceChange(collectionAddress: string, tokenId: string) {
  return useQuery({
    queryKey: ['price-change', collectionAddress, tokenId],
    queryFn: async () => {
      const response = await fetch(
        `/api/price-history/${collectionAddress}/${tokenId}?limit=2`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch price history');
      }
      const data = await response.json();
      const sales = data.sales || [];
      if (sales.length < 2) {
        return { change: 0, changePercent: 0 };
      }
      const [latest, previous] = sales;
      const latestPrice = Number(latest.price);
      const previousPrice = Number(previous.price);
      const change = latestPrice - previousPrice;
      const changePercent = previousPrice === 0 ? 0 : (change / previousPrice) * 100;
      return { change, changePercent, latestPrice, previousPrice };
    },
    staleTime: 1000 * 60 * 5,
  });
}
