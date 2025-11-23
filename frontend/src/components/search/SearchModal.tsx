/**
 * SearchModal Component
 *
 * Command palette-style search with:
 * - Instant search (cmd/ctrl+K to open)
 * - NFT, collection, and user search
 * - Recent searches
 * - Keyboard navigation
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { searchAll } from '@/lib/algolia';

interface SearchResult {
  id: string;
  type: 'nft' | 'collection' | 'user';
  title: string;
  subtitle?: string;
  image?: string;
  url: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'arc_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search functionality with Algolia
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const suggestions = await searchAll(query, { hitsPerPage: 8 });


        // Map Algolia results to SearchResult format
        const mappedResults: SearchResult[] = [
          ...suggestions.nfts.hits.map((nft: any) => ({
            id: nft.objectID,
            type: 'nft' as const,
            title: nft.name,
            subtitle: nft.collection?.name,
            image: nft.image,
            url: `/nft/${nft.collection?.id}/${nft.tokenId}`,
          })),
          ...suggestions.collections.hits.map((collection: any) => ({
            id: collection.objectID,
            type: 'collection' as const,
            title: collection.name,
            subtitle: `${collection.totalSupply?.toLocaleString() || 0} items`,
            image: collection.image,
            url: `/collection/${collection.address}`,
          })),
          ...suggestions.users.hits.map((user: any) => ({
            id: user.objectID,
            type: 'user' as const,
            title: user.username || user.address.slice(0, 8),
            subtitle: `${user.nftCount || 0} NFTs owned`,
            image: user.avatar,
            url: `/profile/${user.address}`,
          })),
        ];

        setResults(mappedResults);
        setIsLoading(false);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Keyboard navigation
  useHotkeys('down', () => {
    setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
  }, { enabled: isOpen && results.length > 0 });

  useHotkeys('up', () => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  }, { enabled: isOpen && results.length > 0 });

  useHotkeys('enter', () => {
    if (results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  }, { enabled: isOpen && results.length > 0 });

  useHotkeys('escape', () => {
    onClose();
  }, { enabled: isOpen });

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    router.push(result.url);
    onClose();
  };

  const handleRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
          <Search className="h-5 w-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search NFTs, collections, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400"
            aria-label="Search query"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center text-neutral-500">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500" />
            </div>
          )}

          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="mb-2 flex items-center justify-between px-2 py-1">
                <span className="text-xs font-semibold uppercase text-neutral-500">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(search)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm">{search}</span>
                </button>
              ))}
            </div>
          )}

          {!query && !isLoading && recentSearches.length === 0 && (
            <div className="p-8 text-center">
              <TrendingUp className="mx-auto mb-3 h-12 w-12 text-neutral-300" />
              <p className="text-sm text-neutral-500">
                Search for NFTs, collections, or users
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Try "Cosmic Cat" or "Bored Ape"
              </p>
            </div>
          )}

          {query && !isLoading && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-neutral-500">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {result.image && (
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                      <Image
                        src={result.image}
                        alt={result.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase text-neutral-500">
                        {result.type}
                      </span>
                    </div>
                    <p className="truncate font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="truncate text-sm text-neutral-500">{result.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-2 text-xs text-neutral-500 dark:border-neutral-700">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-neutral-300 px-1.5 py-0.5 dark:border-neutral-600">
                ↑
              </kbd>
              <kbd className="rounded border border-neutral-300 px-1.5 py-0.5 dark:border-neutral-600">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-neutral-300 px-1.5 py-0.5 dark:border-neutral-600">
                ↵
              </kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-neutral-300 px-1.5 py-0.5 dark:border-neutral-600">
                esc
              </kbd>
              to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to control search modal
 */
export function useSearchModal() {
  const [isOpen, setIsOpen] = useState(false);

  // Global cmd+K / ctrl+K hotkey
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setIsOpen(true);
  });

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
