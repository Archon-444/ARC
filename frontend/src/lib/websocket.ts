import { useState, useEffect } from 'react';

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

export function useRealtimeActivity() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Mock connection
        setIsConnected(true);

        // Mock initial data or subscription
        // For now, return empty or static data
        setActivities([]);

        return () => {
            setIsConnected(false);
        };
    }, []);

    return {
        activities,
        isConnected,
    };
}
