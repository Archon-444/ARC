/**
 * Search Results Page
 *
 * Displays search results with:
 * - Category tabs (All, NFTs, Collections, Users)
 * - Search filters
 * - Result cards for each type
 * - Pagination
 * - Empty states
 */

'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Grid3x3, User, Filter, X } from 'lucide-react';
import { useSearch, useSearchFromURL } from '@/hooks/useSearch';
import { SearchInput } from '@/components/search/SearchInput';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { formatUSDC, truncateAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';

function SearchPageContent() {
  const router = useRouter();
  const { query: urlQuery, category, setCategory, updateSearchURL } = useSearchFromURL();

  const { query, setQuery, isLoading, results } = useSearch({
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
          <div className="flex gap-2 border-b border-[var(--color-divider)]">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleCategoryChange(tab.value as typeof category)}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
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

        {/* Results */}
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
        ) : !query ? (
          <EmptyState
            icon={Search}
            title="Start searching"
            description="Enter a search query to find NFTs, collections, or users"
          />
        ) : results.total === 0 ? (
          <EmptyState
            icon={Search}
            title="No results found"
            description={`No results found for "${query}". Try a different search term.`}
          />
        ) : (
          <div className="space-y-12">
            {/* Collections */}
            {(category === 'all' || category === 'collections') && results.collections.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
                  Collections ({results.collections.length})
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.collections.map((collection) => (
                    <Link
                      key={collection.objectID}
                      href={`/collection/${collection.address}`}
                      className="group"
                    >
                      <Card hover className="overflow-hidden">
                        <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                          <Image
                            src={collection.image}
                            alt={collection.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2">
                            <h3 className="flex-1 truncate font-semibold text-[var(--color-text-primary)]">
                              {collection.name}
                            </h3>
                            {collection.verified && (
                              <Badge variant="primary" size="sm">
                                ✓
                              </Badge>
                            )}
                          </div>
                          {collection.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                              {collection.description}
                            </p>
                          )}
                          <div className="mt-3 flex items-center justify-between text-sm">
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
                <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
                  NFTs ({results.nfts.length})
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {results.nfts.map((nft) => (
                    <Link
                      key={nft.objectID}
                      href={`/nft/${nft.collection.id}/${nft.tokenId}`}
                      className="group"
                    >
                      <Card hover className="overflow-hidden">
                        <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                          <Image
                            src={nft.image}
                            alt={nft.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {nft.collection.name}
                          </p>
                          <h3 className="mt-1 truncate font-semibold text-[var(--color-text-primary)]">
                            {nft.name}
                          </h3>
                          {nft.price && (
                            <div className="mt-3">
                              <p className="text-xs text-[var(--color-text-tertiary)]">Price</p>
                              <p className="font-bold text-primary-500">
                                {formatUSDC(BigInt(nft.price))}
                              </p>
                            </div>
                          )}
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
                <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
                  Users ({results.users.length})
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {results.users.map((user) => (
                    <Link
                      key={user.objectID}
                      href={`/profile/${user.address}`}
                      className="group"
                    >
                      <Card hover className="p-6">
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
