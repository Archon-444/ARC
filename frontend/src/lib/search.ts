/**
 * Typesense Search Utility
 *
 * Provides search functionality for NFTs, Collections, and Users
 * using Typesense's search API.
 * Replaces the previous Algolia implementation.
 */

import { typesenseClient } from './typesense';
import type { SearchResponse } from 'typesense/lib/Typesense/Documents';

// Index names
export const SEARCH_INDEXES = {
    NFT: 'nfts',
    COLLECTION: 'collections',
    USER: 'users',
} as const;

// Search result types (aligned with previous Algolia types)
export interface NFTSearchResult {
    objectID: string; // mapped from id
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
    // Facet fields
    status?: string;
    traits?: string[];
}

export interface CollectionSearchResult {
    objectID: string; // mapped from id
    name: string;
    description?: string;
    image: string;
    address: string;
    floorPrice?: string;
    totalSupply?: number;
    verified?: boolean;
}

export interface UserSearchResult {
    objectID: string; // mapped from id
    address: string;
    username?: string;
    avatar?: string;
    nftCount?: number;
}

export type SearchResult = NFTSearchResult | CollectionSearchResult | UserSearchResult;

export interface FacetValue {
    value: string;
    count: number;
    highlighted?: string;
}

export interface SearchFacet {
    field_name: string;
    counts: FacetValue[];
    stats?: {
        min?: number;
        max?: number;
        avg?: number;
        sum?: number;
    };
}

export interface SearchResponseWithFacets<T = SearchResult> {
    hits: T[];
    nbHits: number;
    page: number;
    nbPages: number;
    hitsPerPage: number;
    processingTimeMS: number;
    facets?: SearchFacet[];
}

/**
 * Map Typesense hit to NFTSearchResult
 */
function mapNftHit(hit: any): NFTSearchResult {
    const doc = hit.document;
    return {
        objectID: doc.id,
        name: doc.name,
        description: doc.description,
        image: doc.image || '', // Ensure image is present
        tokenId: doc.token_id,
        collection: {
            id: doc.collection_address || '',
            name: doc.collection_name,
        },
        price: doc.price?.toString(),
        owner: doc.owner_address,
        status: doc.status,
        traits: doc.traits,
    };
}

/**
 * Map Typesense hit to CollectionSearchResult
 */
function mapCollectionHit(hit: any): CollectionSearchResult {
    const doc = hit.document;
    return {
        objectID: doc.id,
        name: doc.name,
        description: doc.description,
        image: doc.image || '',
        address: doc.id, // Collection ID is the address
        floorPrice: doc.floor_price?.toString(),
        totalSupply: doc.total_supply,
        verified: doc.verified,
    };
}

/**
 * Map Typesense hit to UserSearchResult
 */
function mapUserHit(hit: any): UserSearchResult {
    const doc = hit.document;
    return {
        objectID: doc.id,
        address: doc.address,
        username: doc.username,
        avatar: doc.avatar,
        nftCount: doc.nft_count,
    };
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
    nfts: SearchResponseWithFacets<NFTSearchResult>;
    collections: SearchResponseWithFacets<CollectionSearchResult>;
    users: SearchResponseWithFacets<UserSearchResult>;
}> {
    const { hitsPerPage = 5, page = 1 } = options;

    try {
        const searchRequests = {
            searches: [
                {
                    collection: SEARCH_INDEXES.NFT,
                    q: query,
                    query_by: 'name,description,collection_name,token_id',
                    per_page: hitsPerPage,
                    page: page,
                },
                {
                    collection: SEARCH_INDEXES.COLLECTION,
                    q: query,
                    query_by: 'name,symbol,description',
                    per_page: hitsPerPage,
                    page: page,
                },
                {
                    collection: SEARCH_INDEXES.USER,
                    q: query,
                    query_by: 'username,address,bio',
                    per_page: hitsPerPage,
                    page: page,
                },
            ],
        };

        const results = await typesenseClient.multiSearch.perform(searchRequests);

        return {
            nfts: {
                hits: (results.results[0] as any).hits?.map(mapNftHit) || [],
                nbHits: (results.results[0] as any).found || 0,
                page: (results.results[0] as any).page || 1,
                nbPages: Math.ceil(((results.results[0] as any).found || 0) / hitsPerPage),
                hitsPerPage,
                processingTimeMS: (results.results[0] as any).search_time_ms || 0,
            },
            collections: {
                hits: (results.results[1] as any).hits?.map(mapCollectionHit) || [],
                nbHits: (results.results[1] as any).found || 0,
                page: (results.results[1] as any).page || 1,
                nbPages: Math.ceil(((results.results[1] as any).found || 0) / hitsPerPage),
                hitsPerPage,
                processingTimeMS: (results.results[1] as any).search_time_ms || 0,
            },
            users: {
                hits: (results.results[2] as any).hits?.map(mapUserHit) || [],
                nbHits: (results.results[2] as any).found || 0,
                page: (results.results[2] as any).page || 1,
                nbPages: Math.ceil(((results.results[2] as any).found || 0) / hitsPerPage),
                hitsPerPage,
                processingTimeMS: (results.results[2] as any).search_time_ms || 0,
            },
        };
    } catch (error) {
        console.error('Typesense search error:', error);
        // Return empty results on error
        const emptyResponse = {
            hits: [],
            nbHits: 0,
            page: 1,
            nbPages: 0,
            hitsPerPage,
            processingTimeMS: 0,
        };
        return {
            nfts: emptyResponse,
            collections: emptyResponse,
            users: emptyResponse,
        };
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
        filterBy?: string;
        facetBy?: string;
        sortBy?: string;
    } = {}
): Promise<SearchResponseWithFacets<T>> {
    const { hitsPerPage = 20, page = 1, filterBy, facetBy, sortBy } = options;

    try {
        let queryBy = 'name';
        if (indexName === SEARCH_INDEXES.NFT) queryBy = 'name,description,collection_name,token_id';
        if (indexName === SEARCH_INDEXES.COLLECTION) queryBy = 'name,symbol,description';
        if (indexName === SEARCH_INDEXES.USER) queryBy = 'username,address,bio';

        const searchParameters: any = {
            q: query,
            query_by: queryBy,
            per_page: hitsPerPage,
            page: page,
            filter_by: filterBy,
            facet_by: facetBy,
            sort_by: sortBy,
        };

        const result = await typesenseClient.collections(indexName).documents().search(searchParameters);

        let mappedHits: T[] = [];
        if (indexName === SEARCH_INDEXES.NFT) {
            mappedHits = (result.hits?.map(mapNftHit) || []) as unknown as T[];
        } else if (indexName === SEARCH_INDEXES.COLLECTION) {
            mappedHits = (result.hits?.map(mapCollectionHit) || []) as unknown as T[];
        } else if (indexName === SEARCH_INDEXES.USER) {
            mappedHits = (result.hits?.map(mapUserHit) || []) as unknown as T[];
        }

        // Map facets
        const facets: SearchFacet[] = result.facet_counts?.map((facet: any) => ({
            field_name: facet.field_name,
            counts: facet.counts.map((c: any) => ({
                value: c.value,
                count: c.count,
                highlighted: c.highlighted,
            })),
            stats: facet.stats,
        })) || [];

        return {
            hits: mappedHits,
            nbHits: result.found,
            page: result.page,
            nbPages: Math.ceil(result.found / hitsPerPage),
            hitsPerPage,
            processingTimeMS: result.search_time_ms,
            facets,
        };
    } catch (error) {
        console.error(`Typesense search error in ${indexName}:`, error);
        return {
            hits: [],
            nbHits: 0,
            page: 1,
            nbPages: 0,
            hitsPerPage,
            processingTimeMS: 0,
            facets: [],
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
