/**
 * useUserXP Hook
 *
 * Fetches and manages user XP, level, and badge data.
 * XP is not indexed yet — returns an honest zeroed profile instead of fabricated ranks.
 */

'use client';

import { useEffect, useState } from 'react';
import type { BadgeId } from '@/lib/gamification';

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

        setError(null);
        setData({
            xp: 0,
            level: 1,
            progress: 0,
            xpToNextLevel: 0,
            badges: [],
        });
        setIsLoading(false);
    }, [address]);

    return { data, isLoading, error };
}
