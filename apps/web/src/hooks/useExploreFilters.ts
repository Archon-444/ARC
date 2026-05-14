'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { debounce } from '@/lib/utils';
import { SORT_OPTIONS, type ViewMode } from '@/lib/explore';
import type { SortOption } from '@/types';

export function useExploreFilters(initialTab: ViewMode | null) {
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<ViewMode>(
    initialTab && ['all', 'listings', 'auctions', 'tokens'].includes(initialTab) ? initialTab : 'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>(SORT_OPTIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab') as ViewMode | null;
    if (tab && ['all', 'listings', 'auctions', 'tokens'].includes(tab)) {
      setViewMode(tab);
    }
  }, [searchParams]);

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  return {
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    showFilters,
    setShowFilters,
  };
}
