'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ActivityEvent, ActivityFilters } from '@/lib/activity-types';

interface UseActivityFeedOptions extends ActivityFilters {
  limit?: number;
  realtime?: boolean;
  enabled?: boolean;
}

interface ActivityResponse {
  events: ActivityEvent[];
  nextCursor?: string;
  hasMore: boolean;
}

export function useActivityFeed({
  collectionAddress,
  tokenId,
  userAddress,
  eventTypes,
  limit = 50,
  realtime = true,
  enabled = true,
}: UseActivityFeedOptions = {}) {
  const [realtimeEvents, setRealtimeEvents] = useState<ActivityEvent[]>([]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['activity', collectionAddress, tokenId, userAddress, eventTypes],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(collectionAddress && { collection: collectionAddress }),
        ...(tokenId && { tokenId }),
        ...(userAddress && { user: userAddress }),
        ...(eventTypes && { types: eventTypes.join(',') }),
        ...(pageParam && { cursor: pageParam }),
      });

      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      return response.json() as Promise<ActivityResponse>;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled,
  });

  useEffect(() => {
    if (!realtime || !enabled) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          filters: {
            collectionAddress,
            tokenId,
            userAddress,
            eventTypes,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const newEvent = JSON.parse(event.data) as ActivityEvent;
        if (collectionAddress && newEvent.collectionAddress !== collectionAddress) return;
        if (tokenId && newEvent.tokenId !== tokenId) return;
        if (userAddress && newEvent.from !== userAddress && newEvent.to !== userAddress) return;
        if (eventTypes && !eventTypes.includes(newEvent.type)) return;

        setRealtimeEvents((prev) => {
          if (prev.some((item) => item.id === newEvent.id)) return prev;
          return [newEvent, ...prev].slice(0, 20);
        });
      } catch (err) {
        console.error('Failed to parse activity event:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('Activity feed WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, [collectionAddress, tokenId, userAddress, eventTypes, realtime, enabled]);

  const allEvents = [
    ...realtimeEvents,
    ...(data?.pages.flatMap((page) => page.events) || []),
  ];

  const uniqueEvents = Array.from(
    new Map(allEvents.map((event) => [event.id, event])).values()
  );

  return {
    events: uniqueEvents,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    error,
    realtimeEventsCount: realtimeEvents.length,
  };
}
'use client';

import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { ActivityEvent, ActivityFilters } from '@/lib/activity-types';

interface UseActivityFeedOptions extends ActivityFilters {
  limit?: number;
  realtime?: boolean;
  enabled?: boolean;
}

interface ActivityResponse {
  events: ActivityEvent[];
  nextCursor?: string;
  hasMore: boolean;
}

export function useActivityFeed({
  collectionAddress,
  tokenId,
  userAddress,
  eventTypes,
  limit = 50,
  realtime = true,
  enabled = true,
}: UseActivityFeedOptions = {}) {
  const [realtimeEvents, setRealtimeEvents] = useState<ActivityEvent[]>([]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['activity', collectionAddress, tokenId, userAddress, eventTypes],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(collectionAddress && { collection: collectionAddress }),
        ...(tokenId && { tokenId }),
        ...(userAddress && { user: userAddress }),
        ...(eventTypes && { types: eventTypes.join(',') }),
        ...(pageParam && { cursor: pageParam }),
      });

      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      return response.json() as Promise<ActivityResponse>;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    enabled,
  });

  useEffect(() => {
    if (!realtime || !enabled) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          filters: {
            collectionAddress,
            tokenId,
            userAddress,
            eventTypes,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const newEvent = JSON.parse(event.data) as ActivityEvent;
        if (collectionAddress && newEvent.collectionAddress !== collectionAddress) return;
        if (tokenId && newEvent.tokenId !== tokenId) return;
        if (userAddress && newEvent.from !== userAddress && newEvent.to !== userAddress) return;
        if (eventTypes && !eventTypes.includes(newEvent.type)) return;

        setRealtimeEvents((prev) => {
          if (prev.some((item) => item.id === newEvent.id)) return prev;
          return [newEvent, ...prev].slice(0, 20);
        });
      } catch (err) {
        console.error('Failed to parse activity event:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('Activity feed WebSocket error:', err);
    };

    return () => ws.close();
  }, [collectionAddress, tokenId, userAddress, eventTypes, realtime, enabled]);

  const allEvents = [
    ...realtimeEvents,
    ...(data?.pages.flatMap((page) => page.events) || []),
  ];

  const uniqueEvents = Array.from(
    new Map(allEvents.map((event) => [event.id, event])).values()
  );

  return {
    events: uniqueEvents,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    error,
  };
}
