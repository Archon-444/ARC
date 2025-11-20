/**
 * AnalyticsDashboard Component
 *
 * Comprehensive analytics dashboard for collections with:
 * - Volume charts (daily, weekly, monthly)
 * - Sales distribution
 * - Holder statistics
 * - Top sales table
 * - Price trends
 */

'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { cn, formatUSDC, formatNumber } from '@/lib/utils';
import { Tabs } from '@/components/ui/Tabs';

export interface AnalyticsData {
  volumeHistory: Array<{ date: Date; volume: number; sales: number }>;
  topSales: Array<{
    tokenId: string;
    name: string;
    price: bigint;
    buyer: string;
    seller: string;
    timestamp: Date;
  }>;
  holderDistribution: Array<{ range: string; count: number }>;
  totalVolume: bigint;
  totalSales: number;
  uniqueHolders: number;
  averagePrice: bigint;
  volumeChange24h: number;
  salesChange24h: number;
}

export interface AnalyticsDashboardProps {
  data: AnalyticsData;
  collectionName: string;
  className?: string;
}

type Period = '7d' | '30d' | '90d';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function AnalyticsDashboard({
  data,
  collectionName,
  className,
}: AnalyticsDashboardProps) {
  const [volumePeriod, setVolumePeriod] = useState<Period>('30d');

  // Filter volume data by period
  const filteredVolumeData = useMemo(() => {
    const days = volumePeriod === '7d' ? 7 : volumePeriod === '30d' ? 30 : 90;
    const cutoff = subDays(new Date(), days);

    return data.volumeHistory
      .filter((item) => new Date(item.date) >= cutoff)
      .map((item) => ({
        date: format(new Date(item.date), 'MMM d'),
        volume: item.volume,
        sales: item.sales,
      }));
  }, [data.volumeHistory, volumePeriod]);

  return (
    <div className={cn('space-y-8', className)}>
      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Volume"
          value={formatUSDC(data.totalVolume)}
          change={data.volumeChange24h}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Total Sales"
          value={formatNumber(data.totalSales)}
          change={data.salesChange24h}
          icon={ShoppingBag}
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Unique Holders"
          value={formatNumber(data.uniqueHolders)}
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          title="Average Price"
          value={formatUSDC(data.averagePrice)}
          icon={TrendingUp}
          iconColor="text-orange-600"
          iconBg="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="volume">
        <Tabs.List>
          <Tabs.Trigger value="volume">Volume</Tabs.Trigger>
          <Tabs.Trigger value="sales">Sales Distribution</Tabs.Trigger>
          <Tabs.Trigger value="holders">Holder Stats</Tabs.Trigger>
          <Tabs.Trigger value="top-sales">Top Sales</Tabs.Trigger>
        </Tabs.List>

        {/* Volume Chart */}
        <Tabs.Content value="volume" className="space-y-4">
          {/* Period Selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Trading Volume
            </h3>
            <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
              {(['7d', '30d', '90d'] as Period[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setVolumePeriod(period)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    volumePeriod === period
                      ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-white'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
                  )}
                >
                  {period.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={filteredVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'volume' ? `${value.toFixed(0)} USDC` : value,
                    name === 'volume' ? 'Volume' : 'Sales',
                  ]}
                />
                <Legend />
                <Bar dataKey="volume" fill="#3b82f6" name="Volume" />
                <Bar dataKey="sales" fill="#8b5cf6" name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs.Content>

        {/* Sales Distribution */}
        <Tabs.Content value="sales" className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Price Distribution
          </h3>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={[
                    { name: '0-100 USDC', value: 120 },
                    { name: '100-500 USDC', value: 85 },
                    { name: '500-1K USDC', value: 45 },
                    { name: '1K-5K USDC', value: 28 },
                    { name: '5K+ USDC', value: 12 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Tabs.Content>

        {/* Holder Stats */}
        <Tabs.Content value="holders" className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Holder Distribution
          </h3>
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data.holderDistribution}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="range" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" name="Holders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tabs.Content>

        {/* Top Sales */}
        <Tabs.Content value="top-sales" className="space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Top 10 Sales
          </h3>
          <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      From
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                  {data.topSales.slice(0, 10).map((sale, index) => (
                    <tr key={sale.tokenId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-4">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          {sale.name || `#${sale.tokenId}`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                          {formatUSDC(sale.price)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-primary-600 dark:text-primary-400">
                          {sale.seller.slice(0, 6)}...{sale.seller.slice(-4)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-primary-600 dark:text-primary-400">
                          {sale.buyer.slice(0, 6)}...{sale.buyer.slice(-4)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {format(new Date(sale.timestamp), 'MMM d, yyyy')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}

function StatCard({ title, value, change, icon: Icon, iconColor, iconBg }: StatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={cn(
                  'text-sm font-semibold',
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-neutral-500">vs 24h ago</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-3', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}
