'use client';

import { useMemo, useState } from 'react';
import { useLaunchedTokensQuery, useTokenLauncherStatsQuery } from '@/hooks/useSubgraphQueries';
import { formatCompactUSDC } from '@/lib/utils';
import type { FeedTab } from '@/lib/home';
import type { LaunchedTokenFeedItem } from '@/components/token/LauncherTokenCard';

function curveProgress(token: LaunchedTokenFeedItem): number {
  const total = Number(token.totalSupply || 1);
  const sold = Number(token.soldSupply || 0);
  return total > 0 ? Math.min(100, (sold / total) * 100) : 0;
}

export function useHomeData() {
  const [feedTab, setFeedTab] = useState<FeedTab>('new');
  const { data: tokens = [], isLoading: loading, error: queryError } = useLaunchedTokensQuery({
    first: 24,
    skip: 0,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });
  const { data: launcherStats } = useTokenLauncherStatsQuery();

  const cards = (tokens || []) as LaunchedTokenFeedItem[];
  const error = queryError instanceof Error ? queryError.message : queryError ? 'Failed to load tokens' : null;

  const feedCards = useMemo(() => {
    if (feedTab === 'hot') {
      return [...cards]
        .sort((a, b) => Number(b.totalTrades || 0) - Number(a.totalTrades || 0))
        .slice(0, 6);
    }
    if (feedTab === 'graduating') {
      return [...cards]
        .filter((token) => !token.isGraduated)
        .sort((a, b) => curveProgress(b) - curveProgress(a))
        .slice(0, 6);
    }
    return cards.slice(0, 6);
  }, [cards, feedTab]);

  const headlineSummary = (() => {
    if (!launcherStats) {
      return loading ? 'Loading token board...' : 'No launched tokens indexed yet. Be the first.';
    }
    let volumeLabel = '—';
    try {
      volumeLabel = formatCompactUSDC(String(launcherStats.totalVolume || '0'));
    } catch {
      volumeLabel = '—';
    }
    return `${Number(launcherStats.totalTokens || 0).toLocaleString()} tokens · ${volumeLabel} volume · ${Number(launcherStats.totalGraduated || 0).toLocaleString()} graduated`;
  })();

  return {
    launcherStats,
    loading,
    error,
    feedTab,
    setFeedTab,
    feedCards,
    headlineSummary,
  };
}
