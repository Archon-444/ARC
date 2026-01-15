/**
 * useFollow Hook
 *
 * Manages follow/unfollow functionality
 */

'use client';

import { useState, useEffect } from 'react';
import {
    isFollowing,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowCounts,
} from '@/lib/mockSocial';

/**
 * Hook to check and manage follow status
 */
export function useFollowStatus(currentUserAddress?: string, targetUserAddress?: string) {
    const [isFollowingUser, setIsFollowingUser] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!currentUserAddress || !targetUserAddress) {
            setIsFollowingUser(false);
            return;
        }

        const checkStatus = async () => {
            try {
                const status = await isFollowing(currentUserAddress, targetUserAddress);
                setIsFollowingUser(status);
            } catch (err) {
                console.error('Error checking follow status:', err);
            }
        };

        checkStatus();
    }, [currentUserAddress, targetUserAddress]);

    const toggleFollow = async () => {
        if (!currentUserAddress || !targetUserAddress) return;

        setIsLoading(true);
        setError(null);

        try {
            if (isFollowingUser) {
                await unfollowUser(currentUserAddress, targetUserAddress);
                setIsFollowingUser(false);
            } else {
                await followUser(currentUserAddress, targetUserAddress);
                setIsFollowingUser(true);
            }
        } catch (err) {
            setError(err as Error);
            console.error('Error toggling follow:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isFollowing: isFollowingUser,
        isLoading,
        error,
        toggleFollow,
    };
}

/**
 * Hook to get followers list
 */
export function useFollowers(userAddress?: string) {
    const [followers, setFollowers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userAddress) {
            setFollowers([]);
            setIsLoading(false);
            return;
        }

        const fetchFollowers = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getFollowers(userAddress);
                setFollowers(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFollowers();
    }, [userAddress]);

    return { followers, isLoading, error };
}

/**
 * Hook to get following list
 */
export function useFollowing(userAddress?: string) {
    const [following, setFollowing] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userAddress) {
            setFollowing([]);
            setIsLoading(false);
            return;
        }

        const fetchFollowing = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getFollowing(userAddress);
                setFollowing(data);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFollowing();
    }, [userAddress]);

    return { following, isLoading, error };
}

/**
 * Hook to get follow counts (followers + following)
 */
export function useFollowCounts(userAddress?: string) {
    const [counts, setCounts] = useState({ followers: 0, following: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userAddress) {
            setCounts({ followers: 0, following: 0 });
            setIsLoading(false);
            return;
        }

        const fetchCounts = async () => {
            setIsLoading(true);

            try {
                const data = await getFollowCounts(userAddress);
                setCounts(data);
            } catch (err) {
                console.error('Error fetching follow counts:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCounts();

        // Refresh counts every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, [userAddress]);

    return { counts, isLoading };
}
