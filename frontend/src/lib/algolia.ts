/**
 * Algolia Search Configuration and Utilities
 *
 * Provides search functionality for NFTs, Collections, and Users
 * using Algolia's search API
 */

import algoliasearch, { SearchClient } from 'algoliasearch';

// Algolia configuration
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const ALGOLIA_SEARCH_API_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '';

// Initialize Algolia client
let searchClient: SearchClient | null = null;

export function getSearchClient(): SearchClient {
  if (!searchClient) {
    if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_API_KEY) {
      console.warn('Algolia credentials not configured. Search will use mock data.');
      // Return a mock client for development
      return createMockClient();
    }
    searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY);
  }
  return searchClient;
}

// Index names
export const ALGOLIA_INDEXES = {
  NFT: 'nfts',
  COLLECTION: 'collections',
  USER: 'users',
} as const;

// Search result types
export interface NFTSearchResult {
  objectID: string;
  name: string;
  description?: string;
  image: string;
  tokenId: string;
  collection: {
    id: string;
    name: string;
  };
  price?: string;
  owner: string;
}

export interface CollectionSearchResult {
  objectID: string;
  name: string;
  description?: string;
  image: string;
  address: string;
  floorPrice?: string;
  totalSupply?: number;
  verified?: boolean;
}

export interface UserSearchResult {
  objectID: string;
  address: string;
  username?: string;
  avatar?: string;
  nftCount?: number;
}

export type SearchResult = NFTSearchResult | CollectionSearchResult | UserSearchResult;

export interface SearchResponse<T = SearchResult> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
}

/**
 * Search across all indexes
 */
export async function searchAll(
  query: string,
  options: {
    hitsPerPage?: number;
    page?: number;
  } = {}
): Promise<{
  nfts: SearchResponse<NFTSearchResult>;
  collections: SearchResponse<CollectionSearchResult>;
  users: SearchResponse<UserSearchResult>;
}> {
  const client = getSearchClient();
  const { hitsPerPage = 5, page = 0 } = options;

  try {
    const results = await client.search([
      {
        indexName: ALGOLIA_INDEXES.NFT,
        query,
        params: {
          hitsPerPage,
          page,
        },
      },
      {
        indexName: ALGOLIA_INDEXES.COLLECTION,
        query,
        params: {
          hitsPerPage,
          page,
        },
      },
      {
        indexName: ALGOLIA_INDEXES.USER,
        query,
        params: {
          hitsPerPage,
          page,
        },
      },
    ]);

    return {
      nfts: results.results[0] as any as SearchResponse<NFTSearchResult>,
      collections: results.results[1] as any as SearchResponse<CollectionSearchResult>,
      users: results.results[2] as any as SearchResponse<UserSearchResult>,
    };
  } catch (error) {
    console.error('Search error:', error);
    // Return mock data on error for development
    return getMockSearchResults(query);
  }
}

/**
 * Search a specific index
 */
export async function searchIndex<T = SearchResult>(
  indexName: string,
  query: string,
  options: {
    hitsPerPage?: number;
    page?: number;
    filters?: string;
    facetFilters?: string[][];
  } = {}
): Promise<SearchResponse<T>> {
  const client = getSearchClient();
  const { hitsPerPage = 20, page = 0, filters, facetFilters } = options;

  try {
    const index = client.initIndex(indexName);
    const results = await index.search(query, {
      hitsPerPage,
      page,
      filters,
      facetFilters,
    });

    return results as any as SearchResponse<T>;
  } catch (error) {
    console.error(`Search error in ${indexName}:`, error);
    return {
      hits: [],
      nbHits: 0,
      page: 0,
      nbPages: 0,
      hitsPerPage,
      processingTimeMS: 0,
    };
  }
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const results = await searchAll(query, { hitsPerPage: limit });

  // Combine and limit results
  const combined: SearchResult[] = [
    ...results.collections.hits,
    ...results.nfts.hits,
    ...results.users.hits,
  ];

  return combined.slice(0, limit * 3);
}

// ============================================
// Mock Data for Development
// ============================================

function createMockClient(): SearchClient {
  return {
    search: async () => ({
      results: [
        { hits: [], nbHits: 0, page: 0, nbPages: 0, hitsPerPage: 5, processingTimeMS: 0 },
        { hits: [], nbHits: 0, page: 0, nbPages: 0, hitsPerPage: 5, processingTimeMS: 0 },
        { hits: [], nbHits: 0, page: 0, nbPages: 0, hitsPerPage: 5, processingTimeMS: 0 },
      ],
    }),
    initIndex: () => ({
      search: async () => ({
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 20,
        processingTimeMS: 0,
      }),
    }),
  } as any;
}

function getMockSearchResults(query: string): {
  nfts: SearchResponse<NFTSearchResult>;
  collections: SearchResponse<CollectionSearchResult>;
  users: SearchResponse<UserSearchResult>;
} {
  const mockNFTs: NFTSearchResult[] = [
    {
      objectID: '1',
      name: `Cosmic Cat #${Math.floor(Math.random() * 1000)}`,
      description: 'A rare cosmic cat from the metaverse',
      image: 'https://via.placeholder.com/400',
      tokenId: '1',
      collection: {
        id: '0x123',
        name: 'Cosmic Cats',
      },
      price: '42000000',
      owner: '0x1234567890abcdef1234567890abcdef12345678',
    },
    {
      objectID: '2',
      name: `Bored Ape #${Math.floor(Math.random() * 10000)}`,
      description: 'A bored ape from the yacht club',
      image: 'https://via.placeholder.com/400',
      tokenId: '2',
      collection: {
        id: '0x456',
        name: 'Bored Ape Yacht Club',
      },
      price: '120000000',
      owner: '0xabcdef1234567890abcdef1234567890abcdef12',
    },
  ];

  const mockCollections: CollectionSearchResult[] = [
    {
      objectID: '1',
      name: 'Cosmic Cats Collection',
      description: 'A collection of 10,000 unique cosmic cats',
      image: 'https://via.placeholder.com/400',
      address: '0x123',
      floorPrice: '35000000',
      totalSupply: 10000,
      verified: true,
    },
    {
      objectID: '2',
      name: 'Bored Ape Yacht Club',
      description: 'A collection of 10,000 bored apes',
      image: 'https://via.placeholder.com/400',
      address: '0x456',
      floorPrice: '100000000',
      totalSupply: 10000,
      verified: true,
    },
  ];

  const mockUsers: UserSearchResult[] = [
    {
      objectID: '1',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      username: 'CryptoCollector',
      avatar: 'https://via.placeholder.com/400',
      nftCount: 42,
    },
  ];

  // Filter based on query
  const filterByQuery = <T extends { name?: string; username?: string }>(items: T[]) => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();
    return items.filter((item) => {
      const searchText = (item.name || item.username || '').toLowerCase();
      return searchText.includes(lowerQuery);
    });
  };

  return {
    nfts: {
      hits: filterByQuery(mockNFTs),
      nbHits: mockNFTs.length,
      page: 0,
      nbPages: 1,
      hitsPerPage: 5,
      processingTimeMS: 10,
    },
    collections: {
      hits: filterByQuery(mockCollections),
      nbHits: mockCollections.length,
      page: 0,
      nbPages: 1,
      hitsPerPage: 5,
      processingTimeMS: 10,
    },
    users: {
      hits: filterByQuery(mockUsers),
      nbHits: mockUsers.length,
      page: 0,
      nbPages: 1,
      hitsPerPage: 5,
      processingTimeMS: 10,
    },
  };
}
