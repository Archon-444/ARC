'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import {
  ACTIVITY_EVENT_COLORS,
  ACTIVITY_EVENT_LABELS,
  ActivityEvent,
  ActivityEventType,
} from '@/lib/activity-types';
import { getTransactionUrl } from '@/lib/utils';
import { ActivityFilters } from '@/components/collection/ActivityFilters';

interface ActivityTableProps {
  collectionAddress?: string;
  tokenId?: string;
  limit?: number;
  showFilters?: boolean;
}

export function ActivityTable({
  collectionAddress,
  tokenId,
  limit = 50,
  showFilters = true,
}: ActivityTableProps) {
  const [selectedTypes, setSelectedTypes] = useState<ActivityEventType[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);

  const { events, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useActivityFeed({
    collectionAddress,
    tokenId,
    eventTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    userAddress: selectedUser || undefined,
    limit,
    realtime: true,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || !loadMoreRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <ActivityTableSkeleton />;
  }

  const filteredEvents = events.filter((event) => {
    if (priceRange[0] > 0 || priceRange[1] > 0) {
      const price = Number(event.price || 0);
      if (priceRange[0] > 0 && price < priceRange[0]) return false;
      if (priceRange[1] > 0 && price > priceRange[1]) return false;
    }
    return true;
  });

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        No activity found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters ? (
        <ActivityFilters
          selectedTypes={selectedTypes}
          onTypeChange={setSelectedTypes}
          selectedUser={selectedUser}
          onUserChange={setSelectedUser}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />
      ) : null}

      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Event</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">From</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {filteredEvents.map((event) => (
              <ActivityRow key={event.id} event={event} />
            ))}
          </tbody>
        </table>
      </div>

      {hasNextPage ? (
        <div ref={loadMoreRef} className="py-4 text-center text-sm text-neutral-500">
          {isFetchingNextPage ? (
            'Loading more...'
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Load more
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
      <td className="px-4 py-4 whitespace-nowrap">
        <span className={`font-medium ${ACTIVITY_EVENT_COLORS[event.type]}`}>
          {ACTIVITY_EVENT_LABELS[event.type]}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {event.tokenImage ? (
            <img src={event.tokenImage} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="h-10 w-10 rounded bg-neutral-100 dark:bg-neutral-800" />
          )}
          <span className="font-medium">
            {event.tokenName || `#${event.tokenId}`}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        {event.price ? (
          <div>
            <div className="font-medium">{event.price} USDC</div>
            {event.priceUSD ? (
              <div className="text-xs text-neutral-500">${event.priceUSD}</div>
            ) : null}
          </div>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <Link href={`/profile/${event.from}`} className="text-blue-600 hover:underline">
          {formatAddress(event.from)}
        </Link>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        {event.to ? (
          <Link href={`/profile/${event.to}`} className="text-blue-600 hover:underline">
            {formatAddress(event.to)}
          </Link>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">
        {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        {event.transactionHash ? (
          <a
            href={getTransactionUrl(event.transactionHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink size={14} />
          </a>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ActivityTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      ))}
    </div>
  );
}
'use client';

import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import {
  ActivityEvent,
  ACTIVITY_EVENT_COLORS,
  ACTIVITY_EVENT_LABELS,
} from '@/lib/activity-types';
import { getTransactionUrl } from '@/lib/utils';

interface ActivityTableProps {
  collectionAddress?: string;
  tokenId?: string;
  limit?: number;
  showFilters?: boolean;
}

export function ActivityTable({
  collectionAddress,
  tokenId,
  limit = 50,
  showFilters = true,
}: ActivityTableProps) {
  const { events, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useActivityFeed({
    collectionAddress,
    tokenId,
    limit,
    realtime: true,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        fetchNextPage();
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return <ActivityTableSkeleton />;
  }

  if (events.length === 0) {
    return <div className="text-center py-12 text-neutral-500">No activity found</div>;
  }

  return (
    <div className="space-y-4">
      {showFilters ? <ActivityFilters /> : null}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Event</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">From</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {events.map((event) => (
              <ActivityRow key={event.id} event={event} />
            ))}
          </tbody>
        </table>
      </div>

      {hasNextPage ? (
        <div ref={loadMoreRef} className="py-4 text-center text-sm text-neutral-500">
          {isFetchingNextPage ? 'Loading more...' : 'Load more'}
        </div>
      ) : null}
    </div>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition">
      <td className="px-4 py-4 whitespace-nowrap">
        <span className={`font-medium ${ACTIVITY_EVENT_COLORS[event.type]}`}>
          {ACTIVITY_EVENT_LABELS[event.type]}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {event.tokenImage ? (
            <img src={event.tokenImage} alt="" className="w-10 h-10 rounded" />
          ) : null}
          <span className="font-medium">{event.tokenName || `#${event.tokenId}`}</span>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        {event.price ? (
          <div>
            <div className="font-medium">{event.price} USDC</div>
            {event.priceUSD ? (
              <div className="text-xs text-neutral-500">${event.priceUSD}</div>
            ) : null}
          </div>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <a href={`/profile/${event.from}`} className="text-blue-600 hover:underline">
          {formatAddress(event.from)}
        </a>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        {event.to ? (
          <a href={`/profile/${event.to}`} className="text-blue-600 hover:underline">
            {formatAddress(event.to)}
          </a>
        ) : (
          '—'
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-neutral-500">
        {formatDistanceToNow(event.timestamp, { addSuffix: true })}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <a
          href={getTransactionUrl(event.transactionHash as any)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <ExternalLink size={14} />
        </a>
      </td>
    </tr>
  );
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ActivityTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
      ))}
    </div>
  );
}

function ActivityFilters() {
  return null;
}
