/**
 * FollowButton Component
 *
 * Button to follow/unfollow users with follower count
 */

'use client';

import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollowStatus, useFollowCounts } from '@/hooks/useFollow';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
    currentUserAddress?: string;
    targetUserAddress: string;
    showCount?: boolean;
    variant?: 'default' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function FollowButton({
    currentUserAddress,
    targetUserAddress,
    showCount = false,
    variant = 'default',
    size = 'md',
    className,
}: FollowButtonProps) {
    const { isFollowing, isLoading, toggleFollow } = useFollowStatus(
        currentUserAddress,
        targetUserAddress
    );
    const { counts } = useFollowCounts(targetUserAddress);

    // Don't show button if user is trying to follow themselves
    if (
        currentUserAddress &&
        currentUserAddress.toLowerCase() === targetUserAddress.toLowerCase()
    ) {
        return null;
    }

    // Don't show if not connected
    if (!currentUserAddress) {
        return null;
    }

    return (
        <Button
            variant={isFollowing ? 'outline' : variant === 'outline' ? 'outline' : 'primary'}
            size={size}
            onClick={toggleFollow}
            disabled={isLoading}
            className={cn('gap-2', className)}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus className="h-4 w-4" />
                    <span>Unfollow</span>
                </>
            ) : (
                <>
                    <UserPlus className="h-4 w-4" />
                    <span>Follow</span>
                </>
            )}
            {showCount && counts.followers > 0 && (
                <span className="ml-1 text-xs opacity-75">({counts.followers})</span>
            )}
        </Button>
    );
}
