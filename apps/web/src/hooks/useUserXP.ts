/**
 * useUserXP Hook
 *
 * Fetches and manages user XP, level, and badge data
 */

'use client';

import { useEffect, useState } from 'react';
import { calculateLevelProgress, checkBadgeUnlocks, type BadgeId } from '@/lib/gamification';

export interface UserXPData {
    xp: number;
    level: number;
    progress: number;
    xpToNextLevel: number;
    badges: BadgeId[];
    rank?: number;
}

export function useUserXP(address?: string): {
    data: UserXPData | null;
    isLoading: boolean;
    error: Error | null;
} {
    const [data, setData] = useState<UserXPData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!address) {
            setData(null);
            setIsLoading(false);
            return;
        }

        const fetchUserXP = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // TODO: Replace with actual GraphQL query to subgraph
                // For now, use mock data
                const mockXP = Math.floor(Math.random() * 5000) + 100;
                const mockStats = {
                    nftsOwned: Math.floor(Math.random() * 20),
                    totalTransactions: Math.floor(Math.random() * 100),
                    offersMade: Math.floor(Math.random() * 50),
                    auctionsWon: Math.floor(Math.random() * 10),
                    joinedAt: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000, // Random date within last 90 days
                    firstPurchase: true,
                    firstSale: Math.random() > 0.5,
                };

                const { level, progress, xpToNextLevel } = calculateLevelProgress(mockXP);
                const badges = checkBadgeUnlocks(mockStats);

                setData({
                    xp: mockXP,
                    level,
                    progress,
                    xpToNextLevel,
                    badges,
                    rank: Math.floor(Math.random() * 1000) + 1,
                });
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserXP();

        // Poll for updates every 30 seconds
        const interval = setInterval(fetchUserXP, 30000);

        return () => clearInterval(interval);
    }, [address]);

    return { data, isLoading, error };
}
