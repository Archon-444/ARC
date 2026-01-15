/**
 * CollectionPageLayout Component
 *
 * Complete collection page layout integrating:
 * - CollectionHero
 * - Tab navigation (Items, Activity, Analytics)
 * - FilterPanel + NFTGrid
 * - ActivityTable
 * - Collection stats and charts
 */

'use client';

import { useState } from 'react';
import { Search, Grid3x3, List, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CollectionHero, type CollectionStats, type CollectionSocials } from './CollectionHero';
import { FilterPanel, type CollectionFilters } from './FilterPanel';
import { NFTGrid } from '@/components/nft/NFTCard';
import { ActivityTable, type Activity } from '@/components/activity/ActivityTable';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { NFT, Listing, Auction } from '@/types';

export interface Collection {
  id: string;
  name: string;
  description: string;
  creator: string;
  creatorAddress: string;
  bannerImage?: string;
  avatarImage?: string;
  verified?: boolean;
  stats: CollectionStats;
  socials?: CollectionSocials;
  traits?: Array<{
    name: string;
    values: Array<{
      value: string;
      count: number;
      percentage: number;
    }>;
  }>;
}

export interface CollectionPageLayoutProps {
  collection: Collection;
  nfts: NFT[];
  listings?: Record<string, Listing>;
  auctions?: Record<string, Auction>;
  activities?: Activity[];
  isLoading?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortOption =
  | 'price-low-to-high'
  | 'price-high-to-low'
  | 'recently-listed'
  | 'recently-created'
  | 'rarity';

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'recently-listed', label: 'Recently Listed' },
  { value: 'recently-created', label: 'Recently Created' },
  { value: 'price-low-to-high', label: 'Price: Low to High' },
  { value: 'price-high-to-low', label: 'Price: High to Low' },
  { value: 'rarity', label: 'Rarity' },
];

export function CollectionPageLayout({
  collection,
  nfts,
  listings = {},
  auctions = {},
  activities = [],
  isLoading = false,
  className,
}: CollectionPageLayoutProps) {
  const [filters, setFilters] = useState<CollectionFilters>({ traits: {}, status: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recently-listed');
  const [showFilters, setShowFilters] = useState(true);

  // Apply filters and sorting
  const filteredNFTs = nfts
    .filter((nft) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = nft.name?.toLowerCase().includes(query);
        const matchesId = nft.tokenId.includes(query);
        if (!matchesName && !matchesId) return false;
      }

      // Status filters
      if (filters.status.length > 0) {
        const nftId = `${nft.collection.id}-${nft.tokenId}`;
        const hasListing = !!listings[nftId];
        const hasAuction = !!auctions[nftId];

        if (filters.status.includes('Buy Now') && !hasListing) return false;
        if (filters.status.includes('On Auction') && !hasAuction) return false;
      }

      // Price filter
      if (filters.priceMin || filters.priceMax) {
        const nftId = `${nft.collection.id}-${nft.tokenId}`;
        const price = listings[nftId]?.price || auctions[nftId]?.minBid;
        if (!price) return false;

        const priceInUSDC = Number(price) / 1_000_000;
        if (filters.priceMin && priceInUSDC < filters.priceMin) return false;
        if (filters.priceMax && priceInUSDC > filters.priceMax) return false;
      }

      // Trait filters
      if (Object.keys(filters.traits).length > 0) {
        for (const [traitType, values] of Object.entries(filters.traits)) {
          if (!values || values.length === 0) continue;

          const nftTrait = nft.attributes?.find((attr) => attr.trait_type === traitType);
          if (!nftTrait || !values.includes(String(nftTrait.value))) {
            return false;
          }
        }
      }

      return true;
    })
    .sort((a, b) => {
      const aId = `${a.collection.id}-${a.tokenId}`;
      const bId = `${b.collection.id}-${b.tokenId}`;
      const aPrice = listings[aId]?.price || auctions[aId]?.minBid;
      const bPrice = listings[bId]?.price || auctions[bId]?.minBid;

      switch (sortBy) {
        case 'price-low-to-high':
          if (!aPrice) return 1;
          if (!bPrice) return -1;
          return aPrice > bPrice ? 1 : -1;
        case 'price-high-to-low':
          if (!aPrice) return 1;
          if (!bPrice) return -1;
          return aPrice < bPrice ? 1 : -1;
        case 'recently-created':
          return Number(b.tokenId) - Number(a.tokenId);
        case 'recently-listed':
        default:
          // TODO: Sort by listing timestamp
          return 0;
      }
    });

  return (
    <div className={cn('min-h-screen', className)}>
      {/* Collection Hero */}
      <CollectionHero
        name={collection.name}
        description={collection.description}
        creator={collection.creator}
        creatorAddress={collection.creatorAddress}
        bannerImage={collection.bannerImage}
        avatarImage={collection.avatarImage}
        verified={collection.verified}
        stats={collection.stats}
        socials={collection.socials}
      />

      {/* Main Content */}
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="items">
          <Tabs.List className="mb-8">
            <Tabs.Trigger value="items">Items</Tabs.Trigger>
            <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
            <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
          </Tabs.List>

          {/* Items Tab */}
          <Tabs.Content value="items">
            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search by name or token ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* View Mode */}
                <div className="hidden sm:flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-md p-2 transition-colors',
                      viewMode === 'grid'
                        ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                    )}
                    aria-label="Grid view"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-md p-2 transition-colors',
                      viewMode === 'list'
                        ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                        : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                    )}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Toggle Filters (Mobile) */}
                <Button
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between text-sm">
              <p className="text-neutral-600 dark:text-neutral-400">
                {filteredNFTs.length} {filteredNFTs.length === 1 ? 'item' : 'items'}
              </p>
            </div>

            {/* Content Grid */}
            <div className="flex gap-8">
              {/* Filters Sidebar */}
              {showFilters && (
                <motion.aside
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden lg:block w-80 flex-shrink-0"
                >
                  <div className="sticky top-6">
                    <FilterPanel
                      traits={collection.traits}
                      onFilterChange={setFilters}
                    />
                  </div>
                </motion.aside>
              )}

              {/* NFT Grid */}
              <div className="flex-1">
                <NFTGrid
                  nfts={filteredNFTs}
                  listings={listings}
                  auctions={auctions}
                  isLoading={isLoading}
                  emptyMessage="No items match your filters"
                />
              </div>
            </div>
          </Tabs.Content>

          {/* Activity Tab */}
          <Tabs.Content value="activity">
            <ActivityTable
              activities={activities}
              filters={['sale', 'listing', 'offer', 'bid', 'transfer']}
              showNFT={true}
              isLoading={isLoading}
            />
          </Tabs.Content>

          {/* Analytics Tab */}
          <Tabs.Content value="analytics">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
              <TrendingUp className="mx-auto h-12 w-12 text-neutral-400" />
              <p className="mt-4 text-neutral-500 dark:text-neutral-400">
                Analytics Coming Soon
              </p>
              <p className="mt-2 text-sm text-neutral-400">
                View price trends, volume charts, and collection insights
              </p>
            </div>
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  );
}
