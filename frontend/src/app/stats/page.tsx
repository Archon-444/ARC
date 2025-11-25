'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, Users, Package, DollarSign, Clock } from 'lucide-react';
import { fetchMarketplaceStats } from '@/lib/graphql-client';
import { formatUSDC, formatCompactUSDC, formatNumber } from '@/lib/utils';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import type { MarketplaceStats } from '@/types';

type TimeRange = '24h' | '7d' | '30d' | 'all';

export default function StatsPage() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMarketplaceStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingPage label="Loading statistics..." />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Marketplace Stats</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Real-time analytics and insights for ArcMarket
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Volume"
            value={stats ? formatCompactUSDC(stats.totalVolume) : '$0'}
            change="+12.5%"
            trend="up"
            icon={DollarSign}
          />
          <StatCard
            title="Total Sales"
            value={stats ? formatNumber(stats.totalSales) : '0'}
            change="+8.2%"
            trend="up"
            icon={Package}
          />
          <StatCard
            title="Active Listings"
            value={stats ? formatNumber(stats.activeListings) : '0'}
            change="-2.1%"
            trend="down"
            icon={BarChart3}
          />
          <StatCard
            title="Active Auctions"
            value={stats ? formatNumber(stats.activeAuctions) : '0'}
            change="+15.3%"
            trend="up"
            icon={Clock}
          />
        </div>

        {/* Secondary Stats */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Volume Chart Placeholder */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Volume Over Time</h3>
              <Activity className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="flex h-48 items-center justify-center rounded-lg bg-neutral-50 dark:bg-neutral-800">
              <p className="text-sm text-neutral-500">Chart coming soon</p>
            </div>
          </div>

          {/* Top Collections Placeholder */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Top Collections</h3>
              <TrendingUp className="h-5 w-5 text-neutral-400" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                      {i}
                    </span>
                    <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                  <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed Placeholder */}
        <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Activity</h3>
            <Users className="h-5 w-5 text-neutral-400" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-neutral-100 p-4 dark:border-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                  <div>
                    <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
                    <div className="mt-1 h-3 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="mt-1 h-3 w-12 rounded bg-neutral-100 dark:bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</span>
        <Icon className="h-5 w-5 text-neutral-400" />
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</span>
      </div>
      <div className="mt-2 flex items-center gap-1">
        {trend === 'up' ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </span>
        <span className="text-sm text-neutral-500">vs last period</span>
      </div>
    </div>
  );
}
