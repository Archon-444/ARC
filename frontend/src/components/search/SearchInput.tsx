/**
 * SearchInput Component
 *
 * Enhanced search input with:
 * - Autocomplete suggestions
 * - Recent searches
 * - Keyboard navigation
 * - Debounced search
 * - Clear button
 * - Loading states
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchSuggestion {
  id: string;
  type: 'collection' | 'nft' | 'user';
  title: string;
  subtitle?: string;
  image?: string;
  href: string;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  isLoading?: boolean;
  debounceMs?: number;
  showSuggestions?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  onSuggestionSelect,
  placeholder = 'Search collections, NFTs, users...',
  suggestions = [],
  recentSearches = [],
  isLoading = false,
  debounceMs = 300,
  showSuggestions = true,
  className,
  size = 'md',
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce the search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      if (value && onSearch) {
        onSearch(value);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions, value]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + recentSearches.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            const suggestion = suggestions[selectedIndex];
            onSuggestionSelect?.(suggestion);
            setIsFocused(false);
          } else {
            const recentIndex = selectedIndex - suggestions.length;
            const recentQuery = recentSearches[recentIndex];
            onChange(recentQuery);
            onSearch?.(recentQuery);
          }
        } else if (value) {
          onSearch?.(value);
          setIsFocused(false);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isFocused && showSuggestions && (suggestions.length > 0 || recentSearches.length > 0);

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-13 text-lg',
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border border-neutral-300 bg-white pl-10 pr-20 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white',
            sizeClasses[size]
          )}
        />

        {/* Loading / Clear Button */}
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
          {value && !isLoading && (
            <button
              onClick={handleClear}
              className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="max-h-[400px] overflow-y-auto">
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <div className="border-b border-neutral-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => {
                        onSuggestionSelect?.(suggestion);
                        setIsFocused(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                        selectedIndex === index
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      )}
                    >
                      {suggestion.image && (
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                          <img
                            src={suggestion.image}
                            alt={suggestion.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                          {suggestion.title}
                        </p>
                        {suggestion.subtitle && (
                          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {suggestion.subtitle}
                          </p>
                        )}
                      </div>
                      <TypeBadge type={suggestion.type} />
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className={cn(suggestions.length > 0 && 'border-t border-neutral-100 dark:border-neutral-800')}>
                  <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => {
                    const adjustedIndex = suggestions.length + index;
                    return (
                      <button
                        key={search}
                        onClick={() => {
                          onChange(search);
                          onSearch?.(search);
                          setIsFocused(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                          selectedIndex === adjustedIndex
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        )}
                      >
                        <Clock className="h-4 w-4 text-neutral-400" />
                        <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">
                          {search}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypeBadge({ type }: { type: 'collection' | 'nft' | 'user' }) {
  const config = {
    collection: { label: 'Collection', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    nft: { label: 'NFT', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    user: { label: 'User', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  }[type];

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', config.color)}>
      {config.label}
    </span>
  );
}
