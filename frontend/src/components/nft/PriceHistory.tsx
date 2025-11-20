/**
 * Price History Component
 *
 * Interactive price chart with time range filters and statistics
 * Uses Recharts for data visualization
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { fadeInUpVariants } from '@/lib/animations';
import type { Address } from '@/types';

export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
  date: string;
}

interface PriceHistoryProps {
  data: PriceDataPoint[];
  collectionFloorPrice?: number;
  collectionAddress?: Address;
  className?: string;
}

type TimeRange = '7D' | '30D' | '90D' | 'ALL';

const TIME_RANGES: { label: string; value: TimeRange; days: number }[] = [
  { label: '7 Days', value: '7D', days: 7 },
  { label: '30 Days', value: '30D', days: 30 },
  { label: '90 Days', value: '90D', days: 90 },
  { label: 'All Time', value: 'ALL', days: 0 },
];

export function PriceHistory({
  data,
  collectionFloorPrice,
  collectionAddress,
  className = '',
}: PriceHistoryProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (timeRange === 'ALL') return data;

    const range = TIME_RANGES.find((r) => r.value === timeRange);
    if (!range) return data;

    const cutoffDate = Date.now() - range.days * 24 * 60 * 60 * 1000;
    return data.filter((point) => point.timestamp >= cutoffDate);
  }, [data, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        currentPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
      };
    }

    const prices = filteredData.map((d) => d.price);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const priceChange = currentPrice - firstPrice;
    const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

    return {
      currentPrice,
      minPrice,
      maxPrice,
      avgPrice,
      priceChange,
      priceChangePercent,
    };
  }, [filteredData]);

  // Format price for display
  const formatPrice = (value: number) => {
    return `${value.toFixed(4)} ETH`;
  };

  // Format date for tooltip
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-sm mb-1">{data.date}</p>
        <p className="text-white font-semibold">{formatPrice(data.price)}</p>
        {data.volume && (
          <p className="text-gray-400 text-sm mt-1">Volume: {data.volume}</p>
        )}
      </div>
    );
  };

  const isPositive = stats.priceChange >= 0;

  return (
    <motion.div
      variants={fadeInUpVariants}
      initial="initial"
      animate="animate"
      className={`bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Price History</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">
              {formatPrice(stats.currentPrice)}
            </span>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                isPositive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}
                {stats.priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeRange === range.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/30 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Min Price</p>
          <p className="text-white font-semibold">{formatPrice(stats.minPrice)}</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Max Price</p>
          <p className="text-white font-semibold">{formatPrice(stats.maxPrice)}</p>
        </div>
        <div className="bg-gray-700/30 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Avg Price</p>
          <p className="text-white font-semibold">{formatPrice(stats.avgPrice)}</p>
        </div>
        {collectionFloorPrice && (
          <div className="bg-gray-700/30 rounded-lg p-3">
            <p className="text-gray-400 text-sm mb-1">Collection Floor</p>
            <p className="text-white font-semibold">
              {formatPrice(collectionFloorPrice)}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        {filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Activity className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No price history available</p>
            <p className="text-sm">Price data will appear here once sales occur</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDate}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) => `${value.toFixed(2)} ETH`}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Collection floor price reference line */}
              {collectionFloorPrice && (
                <ReferenceLine
                  y={collectionFloorPrice}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Floor',
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 12,
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                fill="url(#priceGradient)"
                name="Price (ETH)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer note */}
      {filteredData.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>{filteredData.length} sales in selected period</span>
          </div>
          {collectionAddress && (
            <a
              href={`/collection/${collectionAddress}/analytics`}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              View detailed analytics →
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}
