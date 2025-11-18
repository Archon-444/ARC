/**
 * ArcMarket TypeScript Type Definitions
 *
 * Comprehensive type system for NFT marketplace entities
 * Ensures type safety across frontend components and API interactions
 */

// ============================================
// Blockchain & Address Types
// ============================================

export type Address = `0x${string}`;
export type TransactionHash = `0x${string}`;
export type TokenId = string;
export type ChainId = number;

// ============================================
// Listing & Sale Status Enums
// ============================================

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED',
}

export enum AuctionStatus {
  ACTIVE = 'ACTIVE',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  CONFIRMING = 'CONFIRMING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

// ============================================
// NFT Collection
// ============================================

export interface Collection {
  id: Address;
  name: string;
  symbol: string;
  totalSupply: string;
  floorPrice: string;
  volumeTraded: string;
  owners?: number;
  description?: string;
  image?: string;
  bannerImage?: string;
  externalUrl?: string;
  createdAt?: string;
}

// ============================================
// NFT Token
// ============================================

export interface NFTMetadata {
  name: string;
  description?: string;
  image: string;
  external_url?: string;
  attributes?: NFTAttribute[];
  animation_url?: string;
  background_color?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
}

export interface NFT {
  id: string; // Format: "collection-tokenId"
  tokenId: TokenId;
  name: string;
  description?: string;
  image: string;
  owner: Address;
  collection: Collection;
  metadata?: NFTMetadata;
  attributes?: NFTAttribute[];
  listings?: Listing[];
  auctions?: Auction[];
  sales?: Sale[];
}

// ============================================
// Marketplace Listing
// ============================================

export interface Listing {
  id: string;
  collection: Address;
  tokenId: TokenId;
  seller: Address;
  price: string; // In USDC (6 decimals)
  createdAt: string; // Unix timestamp
  updatedAt?: string;
  status: ListingStatus;
  nft?: NFT;
}

// ============================================
// Auction
// ============================================

export interface Auction {
  id: string;
  collection: Address;
  tokenId: TokenId;
  seller: Address;
  highestBid: string; // In USDC (6 decimals)
  highestBidder: Address | null;
  startTime: string; // Unix timestamp
  endTime: string; // Unix timestamp
  minBid: string; // In USDC (6 decimals)
  status: AuctionStatus;
  nft?: NFT;
  bids?: Bid[];
}

export interface Bid {
  id: string;
  amount: string; // In USDC (6 decimals)
  bidder: Address;
  timestamp: string; // Unix timestamp
  auction: Auction;
}

// ============================================
// Sale (Transaction Record)
// ============================================

export interface Sale {
  id: string;
  price: string; // In USDC (6 decimals)
  buyer: Address;
  seller: Address;
  timestamp: string; // Unix timestamp
  transactionHash?: TransactionHash;
  nft?: NFT;
}

// ============================================
// User / Profile
// ============================================

export interface User {
  id: Address;
  username?: string;
  bio?: string;
  avatar?: string;
  bannerImage?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  verified?: boolean;
  createdAt?: string;

  // Activity
  listings?: Listing[];
  bids?: Bid[];
  purchases?: Sale[];
  sales?: Sale[];
  ownedNFTs?: NFT[];
}

// ============================================
// Marketplace Statistics
// ============================================

export interface MarketplaceStats {
  id: string;
  totalVolume: string; // In USDC (6 decimals)
  dailyVolume: string; // In USDC (6 decimals)
  totalSales: number;
  dailySales: number;
  activeListings: number;
  activeAuctions: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  timestamp: string; // Unix timestamp
}

export interface DailyStats {
  date: string;
  volume: string;
  sales: number;
  avgPrice: string;
  uniqueTraders: number;
}

// ============================================
// Transaction Types
// ============================================

export interface Transaction {
  hash: TransactionHash;
  status: TransactionStatus;
  type: 'list' | 'buy' | 'bid' | 'cancel' | 'settle' | 'approve';
  timestamp: number;
  confirmations?: number;
  error?: string;
}

export interface PendingTransaction extends Transaction {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// ============================================
// Pagination & Filtering
// ============================================

export interface PaginationParams {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface FilterParams {
  minPrice?: string;
  maxPrice?: string;
  collections?: Address[];
  attributes?: Record<string, string[]>;
  status?: ListingStatus | AuctionStatus;
}

export interface SortOption {
  label: string;
  value: string;
  orderBy: string;
  orderDirection: 'asc' | 'desc';
}

// ============================================
// Form Types
// ============================================

export interface ListingFormData {
  collection: Address;
  tokenId: TokenId;
  price: string; // In USDC
  duration?: number; // In seconds
}

export interface AuctionFormData {
  collection: Address;
  tokenId: TokenId;
  minBid: string; // In USDC
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
}

export interface BidFormData {
  auctionId: string;
  amount: string; // In USDC
}

export interface OfferFormData {
  collection: Address;
  tokenId: TokenId;
  price: string; // In USDC
  expiration: number; // Unix timestamp
}

// ============================================
// API Response Types
// ============================================

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface ListingsResponse {
  listings: Listing[];
}

export interface AuctionsResponse {
  auctions: Auction[];
}

export interface NFTResponse {
  nft: NFT;
}

export interface UserResponse {
  user: User;
}

export interface StatsResponse {
  dailySnapshot: MarketplaceStats;
}

// ============================================
// Component Prop Types
// ============================================

export interface NFTCardProps {
  nft: NFT;
  listing?: Listing;
  auction?: Auction;
  showOwner?: boolean;
  showPrice?: boolean;
  onClick?: () => void;
}

export interface CollectionCardProps {
  collection: Collection;
  onClick?: () => void;
}

export interface ListingCardProps {
  listing: Listing;
  onClick?: () => void;
}

export interface AuctionCardProps {
  auction: Auction;
  onClick?: () => void;
}

// ============================================
// Hook Return Types
// ============================================

export interface UseMarketplaceReturn {
  // Listings
  createListing: (data: ListingFormData) => Promise<TransactionHash>;
  cancelListing: (listingId: string) => Promise<TransactionHash>;
  buyNFT: (listingId: string) => Promise<TransactionHash>;
  updateListingPrice: (listingId: string, newPrice: string) => Promise<TransactionHash>;

  // Auctions
  createAuction: (data: AuctionFormData) => Promise<TransactionHash>;
  placeBid: (data: BidFormData) => Promise<TransactionHash>;
  settleAuction: (auctionId: string) => Promise<TransactionHash>;
  cancelAuction: (auctionId: string) => Promise<TransactionHash>;

  // State
  isLoading: boolean;
  error: Error | null;
}

export interface UseUSDCReturn {
  balance: bigint | undefined;
  allowance: bigint | undefined;
  approve: (spender: Address, amount: bigint) => Promise<TransactionHash>;
  isApproving: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface UseNFTReturn {
  nft: NFT | null;
  listing: Listing | null;
  auction: Auction | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================
// Utility Types
// ============================================

export type Awaited<T> = T extends Promise<infer U> ? U : T;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// ============================================
// Constants
// ============================================

export const USDC_DECIMALS = 6; // CRITICAL: USDC has 6 decimals on Arc!
export const SECONDS_PER_DAY = 86400;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
