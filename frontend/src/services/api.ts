/**
 * Complete API Service Layer
 * 
 * Connects frontend to backend REST API (Express server)
 * Backend location: backend/src/
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_BACKEND_URL: Backend API base URL (default: http://localhost:3001)
 * 
 * Usage:
 * ```typescript
 * import { api } from '@/services/api';
 * 
 * // Search
 * const results = await api.search.autocomplete('Bored Ape');
 * 
 * // Analytics
 * const volume = await api.analytics.getVolume('collection-id', '30D');
 * 
 * // Price History
 * const history = await api.priceHistory.get('nft-id', '7D');
 * 
 * // Activity
 * const activity = await api.activity.list({ nftId: 'nft-id' });
 * 
 * // Offers
 * const offer = await api.offers.create(offerData, userToken);
 * ```
 */

import { formatUnits } from 'viem';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchSuggestion {
  id: string;
  type: 'collection' | 'nft' | 'user';
  name: string;
  image?: string;
  subtitle?: string;
  verified?: boolean;
}

export interface SearchResult {
  collections: SearchSuggestion[];
  nfts: SearchSuggestion[];
  users: SearchSuggestion[];
}

export interface VolumeDataPoint {
  timestamp: number;
  date: string;
  volume: string; // USDC amount
  sales: number;
}

export interface SalesDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface HolderDistribution {
  range: string;
  holders: number;
  percentage: number;
}

export interface TopSale {
  rank: number;
  nftId: string;
  nftName: string;
  nftImage: string;
  price: string;
  buyer: string;
  seller: string;
  timestamp: number;
  txHash: string;
}

export interface AnalyticsData {
  volumeHistory: VolumeDataPoint[];
  salesDistribution: SalesDistribution[];
  holderDistribution: HolderDistribution[];
  topSales: TopSale[];
  totalVolume: string;
  totalSales: number;
  uniqueHolders: number;
  averagePrice: string;
  volumeChange24h: number;
  salesChange24h: number;
}

export interface PriceHistoryPoint {
  timestamp: number;
  date: string;
  price: string;
  eventType: 'sale' | 'listing' | 'offer';
  txHash?: string;
}

export interface PriceHistoryData {
  points: PriceHistoryPoint[];
  currentPrice: string;
  highPrice: string;
  lowPrice: string;
  priceChange: number;
  priceChangeUSD: string;
}

export type ActivityEventType = 'sale' | 'listing' | 'transfer' | 'offer' | 'bid' | 'cancel';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  nftId: string;
  nftName: string;
  nftImage: string;
  collectionName: string;
  price?: string;
  from: string;
  to: string;
  timestamp: number;
  txHash: string;
}

export interface ActivityFilters {
  nftId?: string;
  collectionId?: string;
  userAddress?: string;
  eventTypes?: ActivityEventType[];
  startTime?: number;
  endTime?: number;
}

export interface OfferData {
  nftId: string;
  collectionAddress: string;
  tokenId: string;
  price: string;
  expirationDays: number;
  offerMaker: string;
}

export interface Offer {
  id: string;
  nftId: string;
  price: string;
  priceUSD: string;
  floorDifference: number;
  expiresAt: number;
  maker: string;
  status: 'active' | 'accepted' | 'cancelled' | 'expired';
  createdAt: number;
}

export interface UserProfile {
  address: string;
  username?: string;
  bio?: string;
  avatar?: string;
  verified: boolean;
  joinedAt: number;
  stats: {
    nftsOwned: number;
    collections: number;
    totalVolume: string;
    offersMade: number;
    offersReceived: number;
  };
}

// ============================================================================
// BASE HTTP CLIENT
// ============================================================================

class HTTPClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          code: errorData.code,
          details: errorData,
        } as APIError;
      }

      return await response.json();
    } catch (error) {
      if (retries > 0 && (error instanceof TypeError || (error as APIError).status && (error as APIError).status! >= 500)) {
        await this.delay(Math.pow(2, 4 - retries) * 1000);
        return this.request<T>(endpoint, options, retries - 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<T>(`${endpoint}${query}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }
}

// ============================================================================
// API MODULES
// ============================================================================

class SearchAPI {
  constructor(private client: HTTPClient) {}

  async autocomplete(query: string, limit = 5): Promise<SearchResult> {
    return this.client.post<SearchResult>('/v1/search/autocomplete', { query, limit });
  }
}

class AnalyticsAPI {
  constructor(private client: HTTPClient) {}

  async getVolume(collectionId: string, period: '7D' | '30D' | '90D' | '1Y' | 'All' = '30D'): Promise<VolumeDataPoint[]> {
    const response = await this.client.get<{ data: VolumeDataPoint[] }>('/v1/analytics/volume', { collectionId, period });
    return response.data;
  }

  async getSalesDistribution(collectionId: string): Promise<SalesDistribution[]> {
    const response = await this.client.get<{ data: SalesDistribution[] }>('/v1/analytics/sales-distribution', { collectionId });
    return response.data;
  }

  async getHolderStats(collectionId: string): Promise<HolderDistribution[]> {
    const response = await this.client.get<{ data: HolderDistribution[] }>('/v1/analytics/holder-stats', { collectionId });
    return response.data;
  }

  async getTopSales(collectionId: string, limit = 10): Promise<TopSale[]> {
    const response = await this.client.get<{ data: TopSale[] }>('/v1/analytics/top-sales', { collectionId, limit });
    return response.data;
  }

  async getCollectionAnalytics(collectionId: string, period: '7D' | '30D' | '90D' | '1Y' | 'All' = '30D'): Promise<AnalyticsData> {
    const [volumeHistory, salesDistribution, holderDistribution, topSales] = await Promise.all([
      this.getVolume(collectionId, period),
      this.getSalesDistribution(collectionId),
      this.getHolderStats(collectionId),
      this.getTopSales(collectionId),
    ]);

    const totalVolume = volumeHistory.reduce((sum, point) => sum + BigInt(point.volume), BigInt(0));
    const totalSales = volumeHistory.reduce((sum, point) => sum + point.sales, 0);
    const averagePrice = totalSales > 0 ? totalVolume / BigInt(totalSales) : BigInt(0);
    const volumeChange24h = volumeHistory.length >= 2 ? ((BigInt(volumeHistory[volumeHistory.length - 1].volume) - BigInt(volumeHistory[volumeHistory.length - 2].volume)) * BigInt(100)) / BigInt(volumeHistory[volumeHistory.length - 2].volume) : BigInt(0);
    const salesChange24h = volumeHistory.length >= 2 ? ((volumeHistory[volumeHistory.length - 1].sales - volumeHistory[volumeHistory.length - 2].sales) * 100) / volumeHistory[volumeHistory.length - 2].sales : 0;
    const uniqueHolders = holderDistribution.reduce((sum, dist) => sum + dist.holders, 0);

    return {
      volumeHistory,
      salesDistribution,
      holderDistribution,
      topSales,
      totalVolume: formatUnits(totalVolume, 6),
      totalSales,
      uniqueHolders,
      averagePrice: formatUnits(averagePrice, 6),
      volumeChange24h: Number(volumeChange24h),
      salesChange24h,
    };
  }
}

class PriceHistoryAPI {
  constructor(private client: HTTPClient) {}

  async get(nftId: string, period: '7D' | '30D' | '90D' | '1Y' | 'All' = '30D'): Promise<PriceHistoryData> {
    const [contractAddress, tokenId] = nftId.split(':');
    return this.client.get<PriceHistoryData>(`/v1/nft/${contractAddress}/${tokenId}/price-history`, { period });
  }
}

class ActivityAPI {
  constructor(private client: HTTPClient) {}

  async list(filters?: ActivityFilters, pagination?: PaginationParams): Promise<ActivityEvent[]> {
    const params: Record<string, string> = {
      ...(pagination?.page && { page: pagination.page.toString() }),
      ...(pagination?.limit && { limit: pagination.limit.toString() }),
      ...(filters?.nftId && { nftId: filters.nftId }),
      ...(filters?.collectionId && { collectionId: filters.collectionId }),
      ...(filters?.userAddress && { userAddress: filters.userAddress }),
      ...(filters?.eventTypes && { eventTypes: filters.eventTypes.join(',') }),
      ...(filters?.startTime && { startTime: filters.startTime.toString() }),
      ...(filters?.endTime && { endTime: filters.endTime.toString() }),
    };

    const response = await this.client.get<{ data: ActivityEvent[] }>('/v1/activity', params);
    return response.data;
  }
}

class OffersAPI {
  constructor(private client: HTTPClient) {}

  async create(offerData: OfferData, userToken: string): Promise<Offer> {
    const response = await this.client.post<{ data: Offer }>('/v1/offers', offerData, { Authorization: `Bearer ${userToken}` });
    return response.data;
  }

  async list(nftId: string, status?: 'active' | 'accepted' | 'cancelled' | 'expired'): Promise<Offer[]> {
    const response = await this.client.get<{ data: Offer[] }>(`/v1/nft/${nftId}/offers`, status ? { status } : undefined);
    return response.data;
  }

  async accept(offerId: string, userToken: string): Promise<Offer> {
    const response = await this.client.post<{ data: Offer }>(`/v1/offers/${offerId}/accept`, undefined, { Authorization: `Bearer ${userToken}` });
    return response.data;
  }

  async cancel(offerId: string, userToken: string): Promise<Offer> {
    const response = await this.client.post<{ data: Offer }>(`/v1/offers/${offerId}/cancel`, undefined, { Authorization: `Bearer ${userToken}` });
    return response.data;
  }
}

class UserAPI {
  constructor(private client: HTTPClient) {}

  async getProfile(address: string): Promise<UserProfile> {
    return this.client.get<UserProfile>(`/v1/user/${address}`);
  }
}

// ============================================================================
// MAIN API CLIENT
// ============================================================================

class API {
  private client: HTTPClient;
  public search: SearchAPI;
  public analytics: AnalyticsAPI;
  public priceHistory: PriceHistoryAPI;
  public activity: ActivityAPI;
  public offers: OffersAPI;
  public user: UserAPI;

  constructor(baseURL?: string) {
    const url = baseURL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    this.client = new HTTPClient(url);
    this.search = new SearchAPI(this.client);
    this.analytics = new AnalyticsAPI(this.client);
    this.priceHistory = new PriceHistoryAPI(this.client);
    this.activity = new ActivityAPI(this.client);
    this.offers = new OffersAPI(this.client);
    this.user = new UserAPI(this.client);
  }
}

export const api = new API();
export { API };
export type * from './api';
