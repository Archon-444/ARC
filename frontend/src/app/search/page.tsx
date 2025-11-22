/**
 * Search Results Page
 *
 * Displays search results with:
 * - Category tabs (All, NFTs, Collections, Users)
 * - Search filters (Facets)
 * - Result cards for each type
 * - Pagination
 * - Empty states
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Grid3x3, User, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useSearch, useSearchFromURL } from '@/hooks/useSearch';
import { SearchInput } from '@/components/search/SearchInput';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { formatUSDC, truncateAddress, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function SearchPageContent() {
  const router = useRouter();
  const { query: urlQuery, category, setCategory, updateSearchURL } = useSearchFromURL();
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const {
    query,
    setQuery,
    isLoading,
    results,
    facets,
    activeFacets,
    toggleFacet,
    clearFacets
  } = useSearch({
    category,
    autoSearch: true,
  });

  // Sync URL query with local state on mount
  if (!query && urlQuery) {
    setQuery(urlQuery);
  }

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    updateSearchURL(newQuery, category);
  };

  const handleCategoryChange = (newCategory: typeof category) => {
    setCategory(newCategory);
    updateSearchURL(query, newCategory);
    clearFacets(); // Clear facets when changing category
  };

  const categoryTabs = [
    { value: 'all', label: 'All', count: results.total, icon: Search },
    { value: 'collections', label: 'Collections', count: results.collections.length, icon: Grid3x3 },
    { value: 'nfts', label: 'NFTs', count: results.nfts.length, icon: Package },
    { value: 'users', label: 'Users', count: results.users.length, icon: User },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container-custom space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Search</h1>

          {/* Search Input */}
          <div className="max-w-2xl">
            <SearchInput
              value={query}
              onChange={handleSearch}
              placeholder="Search NFTs, collections, users..."
              size="lg"
              showSuggestions={false}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 border-b border-[var(--color-divider)] overflow-x-auto pb-1">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleCategoryChange(tab.value as typeof category)}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                    category === tab.value
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge variant="neutral" size="sm">
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters (Desktop) */}
          {category !== 'all' && facets.length > 0 && (
            <aside className={cn(
              "hidden w-64 flex-shrink-0 lg:block transition-all duration-300",
              !isFilterOpen && "w-0 overflow-hidden opacity-0"
            )}>
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Filters</h3>
                  {Object.keys(activeFacets).length > 0 && (
                    <button
                      onClick={clearFacets}
                      className="text-xs text-primary-500 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {facets.map((facet) => (
                  <div key={facet.field_name} className="border-b border-[var(--color-divider)] pb-4 last:border-0">
                    <h4 className="mb-3 text-sm font-medium text-[var(--color-text-secondary)] capitalize">
                      {facet.field_name.replace('_', ' ')}
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {facet.counts.map((item) => {
                        const isSelected = activeFacets[facet.field_name]?.includes(item.value);
                        return (
                          <label key={item.value} className="flex items-center gap-2 cursor-pointer group">
                            <div className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-primary-500 border-primary-500 text-white"
                                : "border-neutral-300 dark:border-neutral-600 group-hover:border-primary-400"
                            )}>
                              {isSelected && <X className="h-3 w-3" />}
                            </div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isSelected}
                              onChange={() => toggleFacet(facet.field_name, item.value)}
                            />
                            <span className={cn(
                              "text-sm truncate flex-1",
                              isSelected ? "text-[var(--color-text-primary)] font-medium" : "text-[var(--color-text-secondary)]"
                            )}>
                              {item.value}
                            </span>
                            <span className="text-xs text-[var(--color-text-tertiary)]">
                              {item.count}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}

          {/* Results Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-[var(--color-text-secondary)]">
                Showing {results.total} results
              </div>
              {category !== 'all' && facets.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="hidden lg:flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="aspect-square w-full" />
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : !query && category === 'all' ? (
              <EmptyState
                icon={Search}
                title="Start searching"
                description="Enter a search query to find NFTs, collections, or users"
              />
            ) : results.total === 0 ? (
              <EmptyState
                icon={Search}
                title="No results found"
                description={`No results found for "${query}". Try a different search term or clear filters.`}
                action={
                  Object.keys(activeFacets).length > 0 ? (
                    <Button onClick={clearFacets} variant="outline">
                      Clear Filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-12">
                {/* Collections */}
                {(category === 'all' || category === 'collections') && results.collections.length > 0 && (
                  <section>
                    {category === 'all' && (
                      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
                        Collections ({results.collections.length})
                      </h2>
                    )}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {results.collections.map((collection) => (
                        <Link
                          key={collection.objectID}
                          href={`/collection/${collection.address}`}
                          className="group"
                        >
                          <Card hover className="overflow-hidden h-full flex flex-col">
                            <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                              <Image
                                src={collection.image}
                                alt={collection.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="flex items-center gap-2">
                                <h3 className="flex-1 truncate font-semibold text-[var(--color-text-primary)]">
                                  {collection.name}
                                </h3>
                                {collection.verified && (
                                  <Badge variant="primary" size="sm" className="shrink-0">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                              {collection.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)] flex-1">
                                  {collection.description}
                                </p>
                              )}
                              <div className="mt-3 flex items-center justify-between text-sm pt-3 border-t border-[var(--color-divider)]">
                                {collection.floorPrice && (
                                  <div>
                                    <p className="text-xs text-[var(--color-text-tertiary)]">Floor</p>
                                    <p className="font-semibold text-[var(--color-text-primary)]">
                                      {formatUSDC(BigInt(collection.floorPrice))}
                                    </p>
                                  </div>
                                )}
                                {collection.totalSupply && (
                                  <div className="text-right">
                                    <p className="text-xs text-[var(--color-text-tertiary)]">Items</p>
                                    <p className="font-semibold text-[var(--color-text-primary)]">
                                      {collection.totalSupply.toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* NFTs */}
                {(category === 'all' || category === 'nfts') && results.nfts.length > 0 && (
                  <section>
                    {category === 'all' && (
                      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
                        NFTs ({results.nfts.length})
                      </h2>
                    )}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {results.nfts.map((nft) => (
                        <Link
                          key={nft.objectID}
                          href={`/nft/${nft.collection.id}/${nft.tokenId}`}
                          className="group"
                        >
                          <Card hover className="overflow-hidden h-full flex flex-col">
                            <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                              <Image
                                src={nft.image}
                                alt={nft.name}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                                {nft.collection.name}
                              </p>
                              <h3 className="mt-1 truncate font-semibold text-[var(--color-text-primary)]">
                                {nft.name}
                              </h3>
                              <div className="mt-auto pt-3">
                                {nft.price ? (
                                  <div>
                                    <p className="text-xs text-[var(--color-text-tertiary)]">Price</p>
                                    <p className="font-bold text-primary-500">
                                      {formatUSDC(BigInt(nft.price))}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-[var(--color-text-tertiary)]">Not listed</p>
                                )}
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Users */}
                {(category === 'all' || category === 'users') && results.users.length > 0 && (
                  <section>
                    {category === 'all' && (
                      <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
                        Users ({results.users.length})
                      </h2>
                    )}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {results.users.map((user) => (
                        <Link
                          key={user.objectID}
                          href={`/profile/${user.address}`}
                          className="group"
                        >
                          <Card hover className="p-6 h-full">
                            <div className="flex items-center gap-4">
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                {user.avatar ? (
                                  <Image
                                    src={user.avatar}
                                    alt={user.username || user.address}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <User className="h-8 w-8 text-neutral-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <h3 className="truncate font-semibold text-[var(--color-text-primary)]">
                                  {user.username || truncateAddress(user.address)}
                                </h3>
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                  {truncateAddress(user.address)}
                                </p>
                                {user.nftCount !== undefined && (
                                  <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                                    {user.nftCount} NFTs
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen py-8">
      <div className="container-custom space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="aspect-square w-full" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
