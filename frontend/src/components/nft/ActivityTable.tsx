/**
 * Activity Table Component
 *
 * Comprehensive activity table with filtering, search, and CSV export
 * Displays NFT transaction history with animations
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Filter,
  TrendingUp,
  Tag,
  Users,
  Repeat,
  Sparkles,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { fadeInUpVariants, listItemVariants, staggerContainer } from '@/lib/animations';
import type { Address, TransactionHash } from '@/types';

export type ActivityType = 'sale' | 'listing' | 'offer' | 'transfer' | 'mint' | 'cancel_listing';

export interface Activity {
  id: string;
  type: ActivityType;
  from: Address;
  to?: Address;
  price?: number;
  timestamp: number;
  txHash: TransactionHash;
  tokenId?: string;
  quantity?: number;
}

interface ActivityTableProps {
  activities: Activity[];
  isLoading?: boolean;
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
}

const ACTIVITY_TYPES: { label: string; value: ActivityType; icon: any; color: string }[] = [
  { label: 'Sale', value: 'sale', icon: TrendingUp, color: 'text-green-400' },
  { label: 'Listing', value: 'listing', icon: Tag, color: 'text-blue-400' },
  { label: 'Offer', value: 'offer', icon: Users, color: 'text-purple-400' },
  { label: 'Transfer', value: 'transfer', icon: Repeat, color: 'text-orange-400' },
  { label: 'Mint', value: 'mint', icon: Sparkles, color: 'text-yellow-400' },
  { label: 'Cancel', value: 'cancel_listing', icon: Tag, color: 'text-red-400' },
];

export function ActivityTable({
  activities,
  isLoading = false,
  className = '',
  showSearch = true,
  showFilters = true,
  showExport = true,
}: ActivityTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Filter by type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((a) => selectedTypes.includes(a.type));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.from.toLowerCase().includes(query) ||
          a.to?.toLowerCase().includes(query) ||
          a.txHash.toLowerCase().includes(query) ||
          a.tokenId?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activities, selectedTypes, searchQuery]);

  // Toggle activity type filter
  const toggleTypeFilter = (type: ActivityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Type', 'From', 'To', 'Price (ETH)', 'Date', 'Transaction Hash'];
    const rows = filteredActivities.map((a) => [
      a.type,
      a.from,
      a.to || 'N/A',
      a.price?.toString() || 'N/A',
      new Date(a.timestamp).toLocaleString(),
      a.txHash,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Format address for display
  const formatAddress = (address: Address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Get activity config
  const getActivityConfig = (type: ActivityType) => {
    return ACTIVITY_TYPES.find((t) => t.value === type) || ACTIVITY_TYPES[0];
  };

  // Get explorer URL
  const getExplorerUrl = (txHash: TransactionHash) => {
    return `https://etherscan.io/tx/${txHash}`;
  };

  return (
    <motion.div
      variants={fadeInUpVariants}
      initial="initial"
      animate="animate"
      className={`bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">Activity</h3>
            <p className="text-sm text-gray-400">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'event' : 'events'}
              {selectedTypes.length > 0 && ` (filtered)`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Button */}
            {showExport && filteredActivities.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export CSV</span>
              </button>
            )}

            {/* Filter Button */}
            {showFilters && (
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    selectedTypes.length > 0
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filter</span>
                  {selectedTypes.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                      {selectedTypes.length}
                    </span>
                  )}
                </button>

                {/* Filter Menu */}
                <AnimatePresence>
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 p-2"
                    >
                      {ACTIVITY_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedTypes.includes(type.value);

                        return (
                          <button
                            key={type.value}
                            onClick={() => toggleTypeFilter(type.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : type.color}`} />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by address, token ID, or transaction hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-400">
            <Calendar className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">No activity found</p>
            <p className="text-sm">
              {activities.length === 0
                ? 'Activity will appear here once transactions occur'
                : 'Try adjusting your filters or search query'}
            </p>
          </div>
        ) : (
          <motion.table
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="w-full"
          >
            <thead className="bg-gray-700/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredActivities.map((activity) => {
                  const config = getActivityConfig(activity.type);
                  const Icon = config.icon;

                  return (
                    <motion.tr
                      key={activity.id}
                      variants={listItemVariants}
                      layout
                      className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="text-sm font-medium text-white capitalize">
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.price ? (
                          <span className="text-sm font-semibold text-white">
                            {activity.price.toFixed(4)} ETH
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`https://etherscan.io/address/${activity.from}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          {formatAddress(activity.from)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.to ? (
                          <a
                            href={`https://etherscan.io/address/${activity.to}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            {formatAddress(activity.to)}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-400">{formatDate(activity.timestamp)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={getExplorerUrl(activity.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <span>{formatAddress(activity.txHash)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </motion.table>
        )}
      </div>
    </motion.div>
  );
}
