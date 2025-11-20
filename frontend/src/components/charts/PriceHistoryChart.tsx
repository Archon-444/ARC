/**
 * PriceHistoryChart Component
 *
 * Line chart showing NFT price history over time
 * Uses recharts for visualization with period selectors
 */

'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { cn, formatUSDC } from '@/lib/utils';

export interface PricePoint {
  timestamp: Date;
  price: bigint;
  event?: 'sale' | 'listing';
}

export interface PriceHistoryChartProps {
  data: PricePoint[];
  currency?: string;
  className?: string;
}

type Period = '7d' | '30d' | '90d' | '1y' | 'all';

const PERIOD_CONFIG: Record<Period, { label: string; getDaysAgo: () => Date }> = {
  '7d': { label: '7D', getDaysAgo: () => subDays(new Date(), 7) },
  '30d': { label: '30D', getDaysAgo: () => subDays(new Date(), 30) },
  '90d': { label: '90D', getDaysAgo: () => subDays(new Date(), 90) },
  '1y': { label: '1Y', getDaysAgo: () => subYears(new Date(), 1) },
  all: { label: 'All', getDaysAgo: () => new Date(0) },
};

export function PriceHistoryChart({
  data,
  currency = 'USDC',
  className,
}: PriceHistoryChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    const periodStart = PERIOD_CONFIG[selectedPeriod].getDaysAgo();
    return data
      .filter((point) => new Date(point.timestamp) >= periodStart)
      .map((point) => ({
        timestamp: new Date(point.timestamp).getTime(),
        price: Number(point.price) / 1_000_000, // Convert to decimal
        event: point.event,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data, selectedPeriod]);

  // Calculate stats
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return { current: 0, change: 0, changePercent: 0, high: 0, low: 0 };
    }

    const prices = filteredData.map((d) => d.price);
    const current = prices[prices.length - 1];
    const first = prices[0];
    const change = current - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    const high = Math.max(...prices);
    const low = Math.min(...prices);

    return { current, change, changePercent, high, low };
  }, [filteredData]);

  const isPositive = stats.change >= 0;

  if (data.length === 0) {
    return (
      <div className={cn('rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-900/50', className)}>
        <p className="text-neutral-500 dark:text-neutral-400">No price history available</p>
        <p className="mt-2 text-sm text-neutral-400">
          Price data will appear after the first sale
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats and Period Selector */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Stats */}
        <div className="space-y-1">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Average Price</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neutral-900 dark:text-white">
              {stats.current.toFixed(2)} {currency}
            </span>
            <span
              className={cn(
                'text-sm font-semibold',
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {isPositive ? '+' : ''}
              {stats.changePercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">High: </span>
              <span className="font-medium text-neutral-900 dark:text-white">
                {stats.high.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Low: </span>
              <span className="font-medium text-neutral-900 dark:text-white">
                {stats.low.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
          {(Object.keys(PERIOD_CONFIG) as Period[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                selectedPeriod === period
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              )}
            >
              {PERIOD_CONFIG[period].label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? '#10b981' : '#ef4444'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM d')}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => `${value.toFixed(0)}`}
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      timestamp: number;
      price: number;
      event?: string;
    };
  }>;
  currency: string;
}

function CustomTooltip({ active, payload, currency }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
      <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">
        {format(new Date(data.timestamp), 'MMM d, yyyy h:mm a')}
      </p>
      <p className="text-lg font-bold text-neutral-900 dark:text-white">
        {data.price.toFixed(2)} {currency}
      </p>
      {data.event && (
        <p className="mt-1 text-xs font-medium capitalize text-primary-600 dark:text-primary-400">
          {data.event}
        </p>
      )}
    </div>
  );
}
