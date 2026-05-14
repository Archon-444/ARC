/**
 * Explore Page — Types, constants, and pure helpers
 */

import type { SortOption } from '@/types';

export type ViewMode = 'all' | 'listings' | 'auctions' | 'tokens';

export const ITEMS_PER_PAGE = 20;

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Recently Listed', value: 'recent', orderBy: 'createdAt', orderDirection: 'desc' },
  { label: 'Price: Low to High', value: 'price_asc', orderBy: 'price', orderDirection: 'asc' },
  { label: 'Price: High to Low', value: 'price_desc', orderBy: 'price', orderDirection: 'desc' },
  { label: 'Ending Soon', value: 'ending', orderBy: 'endTime', orderDirection: 'asc' },
];

export function formatAddress(address?: string | null) {
  if (!address) return 'Connect wallet';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
