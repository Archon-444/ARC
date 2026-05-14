'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { BarChart3, Clock, DollarSign, Package } from 'lucide-react';
import { fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatCompactUSDC, formatNumber } from '@/lib/utils';
import type { MarketplaceStats } from '@/types';
import { type AnalyticsLens } from '@/lib/stats';

export function useStatsMetrics() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLens, setAnalyticsLens] = useState<AnalyticsLens>('overview');
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketplaceStats();
      setStats(data);
    } catch (loadError) {
      console.error('Failed to load stats:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Unable to load ARC stats right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const totalInventory = stats ? stats.activeListings + stats.activeAuctions : 0;
  const auctionShare = totalInventory > 0 && stats ? Math.round((stats.activeAuctions / totalInventory) * 100) : 0;
  const listingShare = totalInventory > 0 && stats ? 100 - auctionShare : 0;
  const salesPerInventory = totalInventory > 0 && stats ? (stats.totalSales / totalInventory).toFixed(1) : '0.0';
  const marketMode = !stats
    ? 'Waiting on analytics'
    : stats.activeAuctions > stats.activeListings
      ? 'Auction-heavy'
      : stats.activeListings > stats.activeAuctions * 2
        ? 'Listing-heavy'
        : 'Balanced inventory';
  const dailyVolumeShare =
    stats && stats.totalVolume !== '0'
      ? `${Math.min(100, Math.round((Number(stats.dailyVolume) / Number(stats.totalVolume)) * 100))}%`
      : '0%';

  const statCards = [
    {
      title: 'Total volume',
      value: stats ? formatCompactUSDC(stats.totalVolume) : '$0',
      supportingLabel: 'Live marketplace read',
      icon: DollarSign,
      tone: 'green' as const,
    },
    {
      title: 'Total sales',
      value: stats ? formatNumber(stats.totalSales) : '0',
      supportingLabel: 'Marketplace transactions',
      icon: Package,
      tone: 'blue' as const,
    },
    {
      title: 'Active listings',
      value: stats ? formatNumber(stats.activeListings) : '0',
      supportingLabel: 'Current fixed-price inventory',
      icon: BarChart3,
      tone: 'purple' as const,
    },
    {
      title: 'Active auctions',
      value: stats ? formatNumber(stats.activeAuctions) : '0',
      supportingLabel: 'Current timed inventory',
      icon: Clock,
      tone: 'orange' as const,
    },
  ];

  const computedSignals = [
    {
      title: 'Total inventory',
      value: formatNumber(totalInventory),
      description: 'Combined listings and auctions available in the current ARC market state.',
    },
    {
      title: 'Listing share',
      value: `${listingShare}%`,
      description: 'How much of visible inventory is currently fixed-price supply.',
    },
    {
      title: 'Auction share',
      value: `${auctionShare}%`,
      description: 'How much of visible inventory is currently timed-market supply.',
    },
    {
      title: 'Sales per inventory',
      value: salesPerInventory,
      description: 'A simple turnover proxy using total sales divided by active inventory.',
    },
  ];

  const stateTone = error ? 'red' : isLoading ? 'blue' : stats ? 'green' : 'neutral';
  const stateTitle = error
    ? 'Analytics unavailable'
    : isLoading
      ? 'Refreshing analytics'
      : stats
        ? 'Analytics ready'
        : 'Waiting on analytics';
  const stateDescription = error
    ? 'ARC could not load the stats surface right now. You can retry below or route back into discovery and launch flows.'
    : isLoading
      ? 'ARC is refreshing marketplace totals and activity signals for this analytics view.'
      : stats
        ? 'This surface now acts as the Phase 1 analytics destination, tying computed market signals back into the connected shell and its highest-value follow-on routes.'
        : 'Stats will appear here once marketplace data is available.';

  const lensSummary = {
    overview: 'See the broad marketplace picture first, then branch into action.',
    inventory: 'Focus on supply mix, market shape, and inventory composition.',
    flow: 'Center on velocity, turnover, and how volume translates into activity.',
    shell: 'Use stats as a routing surface back into home, profile, rewards, and token discovery.',
  }[analyticsLens];

  return {
    address,
    isConnected,
    stats,
    isLoading,
    error,
    analyticsLens,
    setAnalyticsLens,
    loadStats,
    totalInventory,
    auctionShare,
    listingShare,
    salesPerInventory,
    marketMode,
    dailyVolumeShare,
    statCards,
    computedSignals,
    stateTone,
    stateTitle,
    stateDescription,
    lensSummary,
  };
}
