/**
 * useSearch Hook
 *
 * React hook for search functionality with Algolia integration
 * Provides search state management, debouncing, and recent searches
 */

import { useState, useEffect, useCallback } from 'use';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  searchAll,
  searchIndex,
  getSearchSuggestions,
  NFTSearchResult,
  CollectionSearchResult,
  UserSearchResult,
  SearchResult,
} from '@/lib/algolia';
import { debounce, getLocalStorage, setLocalStorage } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'arc_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export interface UseSearchOptions {
  category?: 'all' | 'nfts' | 'collections' | 'users';
  autoSearch?: boolean;
  debounceMs?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    category = 'all',
    autoSearch = true,
    debounceMs = 300,
  } = options;

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ nfts: [], collections: [], users: [], total: 0 });
      return;
    }

    setIsLoading(true);

    try {
      if (category === 'all') {
        const response = await searchAll(searchQuery, { hitsPerPage: 20 });
        setResults({
          nfts: response.nfts.hits,
          collections: response.collections.hits,
          users: response.users.hits,
          total: response.nfts.nbHits + response.collections.nbHits + response.users.nbHits,
        });
      } else if (category === 'nfts') {
        const response = await searchIndex<NFTSearchResult>('nfts', searchQuery);
        setResults({
          nfts: response.hits,
          collections: [],
          users: [],
          total: response.nbHits,
        });
      } else if (category === 'collections') {
        const response = await searchIndex<CollectionSearchResult>('collections', searchQuery);
        setResults({
          nfts: [],
          collections: response.hits,
          users: [],
          total: response.nbHits,
        });
      } else if (category === 'users') {
        const response = await searchIndex<UserSearchResult>('users', searchQuery);
        setResults({
          nfts: [],
          collections: [],
          users: response.hits,
          total: response.nbHits,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults({ nfts: [], collections: [], users: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      performSearch(searchQuery);
    }, debounceMs),
    [performSearch, debounceMs]
  );

  // Auto search when query changes
  useEffect(() => {
    if (autoSearch && query) {
      debouncedSearch(query);
    } else if (!query) {
      setResults({ nfts: [], collections: [], users: [], total: 0 });
    }
  }, [query, autoSearch, debouncedSearch]);

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

  return {
    query,
    setQuery,
    isLoading,
    results,
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
