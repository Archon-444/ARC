/**
 * ActivityTable Component
 *
 * Displays transaction activity (sales, listings, transfers, offers, bids)
 * Used on collection pages, NFT detail pages, and user profiles
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Tag,
  Repeat,
  MessageSquare,
  Gavel,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { cn, formatUSDC, truncateAddress, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export type ActivityEvent =
  | 'sale'
  | 'listing'
  | 'transfer'
  | 'offer'
  | 'offer_accepted'
  | 'bid'
  | 'bid_accepted'
  | 'cancel_listing'
  | 'cancel_offer';

export interface Activity {
  id: string;
  event: ActivityEvent;
  nft?: {
    id: string;
    name: string;
    image: string;
    tokenId: string;
  };
  price?: bigint;
  from: string;
  to?: string;
  timestamp: Date;
  transactionHash?: string;
}

export interface ActivityTableProps {
  activities: Activity[];
  filters?: ActivityEvent[];
  showNFT?: boolean;
  showCollection?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const EVENT_CONFIG: Record<
  ActivityEvent,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  sale: {
    label: 'Sale',
    icon: ShoppingCart,
    color: 'text-green-600 dark:text-green-400',
  },
  listing: {
    label: 'Listed',
    icon: Tag,
    color: 'text-blue-600 dark:text-blue-400',
  },
  transfer: {
    label: 'Transfer',
    icon: Repeat,
    color: 'text-neutral-600 dark:text-neutral-400',
  },
  offer: {
    label: 'Offer',
    icon: MessageSquare,
    color: 'text-purple-600 dark:text-purple-400',
  },
  offer_accepted: {
    label: 'Offer Accepted',
    icon: MessageSquare,
    color: 'text-green-600 dark:text-green-400',
  },
  bid: {
    label: 'Bid',
    icon: Gavel,
    color: 'text-orange-600 dark:text-orange-400',
  },
  bid_accepted: {
    label: 'Bid Accepted',
    icon: Gavel,
    color: 'text-green-600 dark:text-green-400',
  },
  cancel_listing: {
    label: 'Cancelled',
    icon: Tag,
    color: 'text-red-600 dark:text-red-400',
  },
  cancel_offer: {
    label: 'Offer Cancelled',
    icon: MessageSquare,
    color: 'text-red-600 dark:text-red-400',
  },
};

export function ActivityTable({
  activities,
  filters = [],
  showNFT = true,
  showCollection = false,
  isLoading = false,
  emptyMessage = 'No activity yet',
  className,
}: ActivityTableProps) {
  const [selectedFilters, setSelectedFilters] = useState<Set<ActivityEvent>>(new Set());

  const filteredActivities =
    selectedFilters.size === 0
      ? activities
      : activities.filter((activity) => selectedFilters.has(activity.event));

  const toggleFilter = (event: ActivityEvent) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(event)) {
      newFilters.delete(event);
    } else {
      newFilters.add(event);
    }
    setSelectedFilters(newFilters);
  };

  const clearFilters = () => setSelectedFilters(new Set());

  if (isLoading) {
    return <ActivityTableSkeleton />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          {filters.map((event) => {
            const config = EVENT_CONFIG[event];
            const isActive = selectedFilters.has(event);
            return (
              <button
                key={event}
                onClick={() => toggleFilter(event)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                )}
              >
                {config.label}
              </button>
            );
          })}
          {selectedFilters.size > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Event
                </th>
                {showNFT && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Item
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  From
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
              <AnimatePresence mode="popLayout">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={showNFT ? 6 : 5} className="px-4 py-12 text-center">
                      <p className="text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((activity) => (
                    <ActivityRow
                      key={activity.id}
                      activity={activity}
                      showNFT={showNFT}
                    />
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface ActivityRowProps {
  activity: Activity;
  showNFT: boolean;
}

function ActivityRow({ activity, showNFT }: ActivityRowProps) {
  const config = EVENT_CONFIG[activity.event];
  const Icon = config.icon;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="group hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
    >
      {/* Event */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', config.color)} />
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {config.label}
          </span>
        </div>
      </td>

      {/* NFT */}
      {showNFT && activity.nft && (
        <td className="px-4 py-4">
          <Link
            href={`/nft/${activity.nft.id}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <div className="h-10 w-10 overflow-hidden rounded-lg">
              <Image
                src={activity.nft.image}
                alt={activity.nft.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              {activity.nft.name}
            </span>
          </Link>
        </td>
      )}

      {/* Price */}
      <td className="px-4 py-4">
        {activity.price ? (
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            {formatUSDC(activity.price)}
          </span>
        ) : (
          <span className="text-sm text-neutral-400">—</span>
        )}
      </td>

      {/* From */}
      <td className="px-4 py-4">
        <Link
          href={`/profile/${activity.from}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {truncateAddress(activity.from)}
        </Link>
      </td>

      {/* To */}
      <td className="px-4 py-4">
        {activity.to ? (
          <Link
            href={`/profile/${activity.to}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {truncateAddress(activity.to)}
          </Link>
        ) : (
          <span className="text-sm text-neutral-400">—</span>
        )}
      </td>

      {/* Time */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatRelativeTime(activity.timestamp)}
          </span>
          {activity.transactionHash && (
            <a
              href={`https://arcscan.com/tx/${activity.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="View transaction"
            >
              <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
            </a>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

function ActivityTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                Event
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
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                    <div className="h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
