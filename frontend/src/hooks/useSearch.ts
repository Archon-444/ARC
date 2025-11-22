/**
 * useSearch Hook
 *
 * React hook for search functionality with Typesense integration
 * Provides search state management, debouncing, and recent searches
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  searchAll,
  searchIndex,
  getSearchSuggestions,
  NFTSearchResult,
  CollectionSearchResult,
  UserSearchResult,
  SearchResult,
  SearchFacet,
  SEARCH_INDEXES,
} from '@/lib/search';
import { debounce, getLocalStorage, setLocalStorage } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'arc_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export interface UseSearchOptions {
  category?: 'all' | 'nfts' | 'collections' | 'users';
  autoSearch?: boolean;
  debounceMs?: number;
  initialFacets?: Record<string, string[]>;
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    category = 'all',
    autoSearch = true,
    debounceMs = 300,
    initialFacets = {},
  } = options;

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFacets, setActiveFacets] = useState<Record<string, string[]>>(initialFacets);
  const [facets, setFacets] = useState<SearchFacet[]>([]);

  const [results, setResults] = useState<{
    nfts: NFTSearchResult[];
    collections: CollectionSearchResult[];
    users: UserSearchResult[];
    total: number;
  }>({
    nfts: [],
    collections: [],
    users: [],
    total: 0,
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = getLocalStorage<string[]>(RECENT_SEARCHES_KEY, []);
    setRecentSearches(recent);
  }, []);

  // Build Typesense filter string from active facets
  const buildFilterString = useCallback(() => {
    const filters: string[] = [];

    Object.entries(activeFacets).forEach(([field, values]) => {
      if (values.length > 0) {
        // Typesense filter format: field:=[value1,value2]
        filters.push(`${field}:=[${values.map(v => `\`${v}\``).join(',')}]`);
      }
    });

    return filters.join(' && ');
  }, [activeFacets]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() && category === 'all') {
      setResults({ nfts: [], collections: [], users: [], total: 0 });
      setFacets([]);
      return;
    }

    setIsLoading(true);

    try {
      const filterBy = buildFilterString();

      if (category === 'all') {
        const response = await searchAll(searchQuery, { hitsPerPage: 20 });
        setResults({
          nfts: response.nfts.hits,
          collections: response.collections.hits,
          users: response.users.hits,
          total: response.nfts.nbHits + response.collections.nbHits + response.users.nbHits,
        });
        setFacets([]); // No facets for 'all' category yet
      } else if (category === 'nfts') {
        // Facet by common fields for NFTs
        const facetBy = 'collection_name,status,traits';
        const response = await searchIndex<NFTSearchResult>(SEARCH_INDEXES.NFT, searchQuery, {
          filterBy,
          facetBy
        });
        setResults({
          nfts: response.hits,
          collections: [],
          users: [],
          total: response.nbHits,
        });
        setFacets(response.facets || []);
      } else if (category === 'collections') {
        const facetBy = 'verified';
        const response = await searchIndex<CollectionSearchResult>(SEARCH_INDEXES.COLLECTION, searchQuery, {
          filterBy,
          facetBy
        });
        setResults({
          nfts: [],
          collections: response.hits,
          users: [],
          total: response.nbHits,
        });
        setFacets(response.facets || []);
      } else if (category === 'users') {
        const response = await searchIndex<UserSearchResult>(SEARCH_INDEXES.USER, searchQuery, { filterBy });
        setResults({
          nfts: [],
          collections: [],
          users: response.hits,
          total: response.nbHits,
        });
        setFacets(response.facets || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({ nfts: [], collections: [], users: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [category, buildFilterString]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      performSearch(searchQuery);
    }, debounceMs),
    [performSearch, debounceMs]
  );

  // Auto search when query or facets change
  useEffect(() => {
    if (autoSearch) {
      debouncedSearch(query);
    }
  }, [query, activeFacets, autoSearch, debouncedSearch]);

  // Save to recent searches
  const saveToRecentSearches = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches((prev) => {
      const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      setLocalStorage(RECENT_SEARCHES_KEY, updated);
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Manual search (for enter key, etc.)
  const search = useCallback(async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      await performSearch(finalQuery);
      saveToRecentSearches(finalQuery);
    }
  }, [query, performSearch, saveToRecentSearches]);

  const toggleFacet = useCallback((field: string, value: string) => {
    setActiveFacets(prev => {
      const current = prev[field] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];

      return {
        ...prev,
        [field]: updated
      };
    });
  }, []);

  const clearFacets = useCallback(() => {
    setActiveFacets({});
  }, []);

  return {
    query,
    setQuery,
    isLoading,
    results,
    facets,
    activeFacets,
    toggleFacet,
    clearFacets,
    recentSearches,
    search,
    clearRecentSearches,
  };
}

/**
 * Hook for search suggestions (autocomplete)
 */
export function useSearchSuggestions(query: string, enabled: boolean = true) {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await getSearchSuggestions(searchQuery, 5);
        setSuggestions(results);
      } catch (error) {
        console.error('Suggestions error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (enabled && query) {
      fetchSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, enabled, fetchSuggestions]);

  return {
    suggestions,
    isLoading,
  };
}

/**
 * Hook for search from URL params (for search results page)
 */
export function useSearchFromURL() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<'all' | 'nfts' | 'collections' | 'users'>('all');

  // Get query from URL
  const query = searchParams?.get('q') || '';
  const categoryParam = searchParams?.get('category') as typeof category | null;

  useEffect(() => {
    if (categoryParam && ['all', 'nfts', 'collections', 'users'].includes(categoryParam)) {
      setCategory(categoryParam);
    }
  }, [categoryParam]);

  // Update URL when search changes
  const updateSearchURL = useCallback((newQuery: string, newCategory?: typeof category) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newCategory && newCategory !== 'all') params.set('category', newCategory);

    router.push(`/search?${params.toString()}`);
  }, [router]);

  return {
    query,
    category,
    setCategory,
    updateSearchURL,
  };
}
