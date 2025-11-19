'use client';

import Link from 'next/link';
import { Search, Clock, Flame, Folder, Users, Sparkles, X } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { formatUSDC } from '@/lib/utils';

type CommandPaletteItem = {
  title: string;
  subtitle?: string;
  href: string;
  icon: ReactNode;
  metric?: string;
  category: 'collections' | 'items' | 'users' | 'chains';
};

const MOCK_DATA: CommandPaletteItem[] = [
  {
    title: 'Arc Originals',
    subtitle: 'Premium generative art drops',
    href: '/collection/arc-originals',
    icon: <Folder className="h-4 w-4" />,
    metric: 'Floor 2.1k USDC',
    category: 'collections',
  },
  {
    title: 'AI Navigator #421',
    subtitle: 'Arc Originals',
    href: '/nft/0x1234/421',
    icon: <Sparkles className="h-4 w-4" />,
    metric: formatUSDC(BigInt(3200000)),
    category: 'items',
  },
  {
    title: 'Synth Labs',
    subtitle: 'Studio team • Verified',
    href: '/profile/synthlabs',
    icon: <Users className="h-4 w-4" />,
    metric: '24.5M USDC volume',
    category: 'users',
  },
  {
    title: 'Arc Gaming Icons',
    subtitle: 'Esports collections',
    href: '/collection/arc-gaming',
    icon: <Folder className="h-4 w-4" />,
    metric: 'Floor 820 USDC',
    category: 'collections',
  },
  {
    title: 'Creative Commons',
    subtitle: 'Explore photography',
    href: '/explore?category=photography',
    icon: <Flame className="h-4 w-4" />,
    metric: 'Trending',
    category: 'items',
  },
];

export default function CommandPalette() {
  const { isOpen, query, setQuery, close, recentSearches, trendingSearches, addRecentSearch } = useCommandPalette();

  const filteredItems = useMemo(() => {
    if (!query) {
      return MOCK_DATA;
    }

    return MOCK_DATA.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const handleSelect = (value: string) => {
    addRecentSearch(value);
    close();
  };

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 transition-all duration-200 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={close} />
      <div className="absolute left-1/2 top-20 w-full max-w-3xl -translate-x-1/2 px-4">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-neutral-900/95">
          <div className="flex items-center gap-3 border-b border-neutral-100/60 px-4 py-3 dark:border-neutral-800">
            <Search className="h-5 w-5 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search collections, NFTs, users or chains"
              className="flex-1 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-white"
            />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">ESC</span>
          </div>

          {recentSearches.length > 0 && !query && (
            <div className="border-b border-neutral-100/60 px-4 py-3 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Recent Searches
              <div className="mt-2 flex flex-wrap gap-2 text-sm normal-case">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleSelect(search)}
                    className="rounded-full border border-neutral-200/70 px-3 py-1 text-neutral-700 transition hover:border-primary-500 hover:text-primary-600 dark:border-neutral-700 dark:text-neutral-300"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!query && (
            <div className="border-b border-neutral-100/60 px-4 py-3 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Trending Searches
              <div className="mt-2 flex flex-wrap gap-2 text-sm normal-case">
                {trendingSearches.map((trend) => (
                  <button
                    key={trend}
                    onClick={() => handleSelect(trend)}
                    className="rounded-full bg-primary-50/80 px-3 py-1 text-primary-700 transition hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-200"
                  >
                    <Flame className="mr-1 h-3.5 w-3.5" />
                    {trend}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {filteredItems.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                <X className="h-10 w-10" />
                <p className="text-base font-medium">No matches</p>
                <p className="text-sm">Try a different query or explore trending searches.</p>
              </div>
            )}

            {filteredItems.length > 0 && (
              <div className="divide-y divide-neutral-100/70 dark:divide-neutral-800">
                {filteredItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => handleSelect(item.title)}
                    className="group flex items-center gap-4 px-5 py-4 transition hover:bg-primary-50/60 dark:hover:bg-primary-500/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 group-hover:bg-primary-600 group-hover:text-white dark:bg-neutral-800 dark:text-neutral-200">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.subtitle}</p>
                      )}
                    </div>
                    {item.metric && (
                      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-300">{item.metric}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100/60 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Cmd/Ctrl + K to open anywhere
            </div>
            <button onClick={close} className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 hover:border-neutral-400 dark:border-neutral-700">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
