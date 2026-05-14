'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface CommandPaletteContextValue {
  isOpen: boolean;
  query: string;
  recentSearches: string[];
  trendingSearches: string[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (value: string) => void;
  addRecentSearch: (value: string) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

const TRENDING_SEARCHES = ['AI Avatars', 'Arc Originals', 'Generative Music', 'Digital Fashion', 'Esports Moments'];

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryState] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQueryState('');
  }, []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
  }, []);

  const addRecentSearch = useCallback((value: string) => {
    setRecentSearches((prev) => {
      const next = [value, ...prev.filter((entry) => entry !== value)].slice(0, 6);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('arcmarket:recent-searches', JSON.stringify(next));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem('arcmarket:recent-searches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isKShortcut = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
      if (isKShortcut) {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const value = useMemo<CommandPaletteContextValue>(() => ({
    isOpen,
    query,
    recentSearches,
    trendingSearches: TRENDING_SEARCHES,
    open,
    close,
    toggle,
    setQuery,
    addRecentSearch,
  }), [isOpen, query, recentSearches, open, close, toggle, setQuery, addRecentSearch]);

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}
