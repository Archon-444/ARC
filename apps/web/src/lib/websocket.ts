import { useState, useEffect, useCallback, useRef } from 'react';

export interface ActivityItem {
    type: 'sale' | 'listing' | 'offer' | 'transfer' | 'mint';
    price?: string;
    timestamp: number;
    nft: {
        id: string;
        name: string;
        image: string;
        collection: string;
    };
}

const POLL_INTERVAL = 15_000; // 15 seconds

export function useRealtimeActivity(limit = 20) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchActivities = useCallback(async () => {
        try {
            const response = await fetch(`/api/activity?limit=${limit}`);
            if (!response.ok) {
                setIsConnected(false);
                return;
            }

            const data = await response.json();
            const events = data.events || [];

            const mapped: ActivityItem[] = events.map((event: {
                id: string;
                type: string;
                collectionAddress?: string;
                tokenId?: string;
                tokenName?: string;
                tokenImage?: string;
                price?: string;
                timestamp?: number;
            }) => ({
                type: event.type as ActivityItem['type'],
                price: event.price,
                timestamp: event.timestamp || Date.now(),
                nft: {
                    id: event.tokenId || event.id,
                    name: event.tokenName || `#${event.tokenId || '?'}`,
                    image: event.tokenImage || '',
                    collection: event.collectionAddress || '',
                },
            }));

            setActivities(mapped);
            setIsConnected(true);
        } catch {
            setIsConnected(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchActivities();
        intervalRef.current = setInterval(fetchActivities, POLL_INTERVAL);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            setIsConnected(false);
        };
    }, [fetchActivities]);

    return { activities, isConnected };
}
