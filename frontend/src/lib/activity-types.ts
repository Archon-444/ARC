export type ActivityEventType = 'sale' | 'transfer' | 'listing' | 'bid' | 'mint' | 'cancel';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  collectionAddress: string;
  tokenId: string;
  tokenName?: string;
  tokenImage?: string;
  from: string;
  to?: string;
  price?: string;
  priceUSD?: string;
  quantity?: number;
  timestamp: number;
  transactionHash?: string;
  blockNumber?: number;
}

export interface ActivityFilters {
  eventTypes?: ActivityEventType[];
  collectionAddress?: string;
  tokenId?: string;
  userAddress?: string;
  minPrice?: string;
  maxPrice?: string;
  startDate?: number;
  endDate?: number;
}

export const ACTIVITY_EVENT_LABELS: Record<ActivityEventType, string> = {
  sale: 'Sale',
  transfer: 'Transfer',
  listing: 'Listing',
  bid: 'Bid',
  mint: 'Mint',
  cancel: 'Cancel',
};

export const ACTIVITY_EVENT_COLORS: Record<ActivityEventType, string> = {
  sale: 'text-green-600 dark:text-green-400',
  transfer: 'text-blue-600 dark:text-blue-400',
  listing: 'text-purple-600 dark:text-purple-400',
  bid: 'text-orange-600 dark:text-orange-400',
  mint: 'text-cyan-600 dark:text-cyan-400',
  cancel: 'text-red-600 dark:text-red-400',
};
export type ActivityEventType = 'sale' | 'transfer' | 'listing' | 'bid' | 'mint' | 'cancel';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  collectionAddress: string;
  tokenId: string;
  tokenName?: string;
  tokenImage?: string;
  from: string;
  to?: string;
  price?: string;
  priceUSD?: string;
  quantity?: number;
  timestamp: number;
  transactionHash: string;
  blockNumber?: number;
}

export interface ActivityFilters {
  eventTypes?: ActivityEventType[];
  collectionAddress?: string;
  tokenId?: string;
  userAddress?: string;
  minPrice?: string;
  maxPrice?: string;
  startDate?: number;
  endDate?: number;
}

export const ACTIVITY_EVENT_LABELS: Record<ActivityEventType, string> = {
  sale: 'Sale',
  transfer: 'Transfer',
  listing: 'Listing',
  bid: 'Bid',
  mint: 'Mint',
  cancel: 'Cancel',
};

export const ACTIVITY_EVENT_COLORS: Record<ActivityEventType, string> = {
  sale: 'text-green-600 dark:text-green-400',
  transfer: 'text-blue-600 dark:text-blue-400',
  listing: 'text-purple-600 dark:text-purple-400',
  bid: 'text-orange-600 dark:text-orange-400',
  mint: 'text-cyan-600 dark:text-cyan-400',
  cancel: 'text-red-600 dark:text-red-400',
};
// Build cache fix - Thu Jan 15 21:42:50 +04 2026
// Force Vercel to use latest commit - 732c714
// Trigger fresh deployment - $(date)