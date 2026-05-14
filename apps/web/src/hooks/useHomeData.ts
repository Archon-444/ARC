'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchListings, fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatUSDC } from '@/lib/utils';
import type { Listing } from '@/types';
import type { MarketplaceStats, FeedTab } from '@/lib/home';

export function useHomeData() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>('new');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingsData, statsData] = await Promise.all([
        fetchListings({
          first: 24,
          skip: 0,
          orderBy: 'createdAt',
          orderDirection: 'desc',
        }),
        fetchMarketplaceStats(),
      ]);

      setListings(listingsData || []);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load home page data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const cards = useMemo(() => {
    return listings.slice(0, 12).map((listing, index) => {
      const createdAt = Number(listing.createdAt) * 1000;
      const mintedAgo = `${Math.max(1, Math.floor((Date.now() - createdAt) / 60000))}m ago`;
      const base = Number(listing.price) / 1_000_000;
      const hotness = 55 + ((index * 7) % 32);
      const curveProgress = 46 + ((index * 9) % 42);

      return {
        id: listing.id,
        href: `/token/${listing.tokenId || listing.id}`,
        name: listing.nft?.name || `ARC Launch #${String(index + 1).padStart(2, '0')}`,
        collection: listing.nft?.collection?.name || 'Arc Launchpad',
        price: formatUSDC(BigInt(listing.price)),
        basePrice: `$${base.toFixed(base >= 1 ? 2 : 4)}`,
        volume: `$${(base * (12 + index * 2)).toFixed(2)}K`,
        traders: 18 + index * 7,
        comments: 4 + index * 3,
        age: mintedAgo,
        hotness,
        curveProgress,
        badge:
          curveProgress > 75
            ? 'Near graduation'
            : hotness > 72
              ? 'Momentum'
              : 'Fresh launch',
      };
    });
  }, [listings]);

  const feedCards = useMemo(() => {
    if (feedTab === 'hot') {
      return [...cards].sort((a, b) => b.hotness - a.hotness).slice(0, 6);
    }
    if (feedTab === 'graduating') {
      return [...cards].sort((a, b) => b.curveProgress - a.curveProgress).slice(0, 6);
    }
    return cards.slice(0, 6);
  }, [cards, feedTab]);

  const liveTape = useMemo(() => {
    return cards.slice(0, 8).map((card, index) => ({
      id: `${card.id}-${index}`,
      title: index % 2 === 0 ? 'New buy' : 'Launch activity',
      detail: `${card.name} · ${index % 2 === 0 ? card.price : card.volume}`,
      meta: index % 2 === 0 ? `${card.traders} traders` : `${card.curveProgress}% to graduation`,
    }));
  }, [cards]);

  const headlineSummary = stats
    ? `${stats.activeListings.toLocaleString()} active listings · ${stats.activeAuctions.toLocaleString()} auctions · ${stats.totalSales.toLocaleString()} total sales`
    : loading
      ? 'Loading marketplace snapshot...'
      : 'Marketplace snapshot unavailable right now';

  return { listings, stats, loading, error, feedTab, setFeedTab, cards, feedCards, liveTape, headlineSummary };
}
