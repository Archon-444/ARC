/**
 * useComments Hook
 *
 * Manages comments functionality
 */

'use client';

import { useState, useEffect } from 'react';
import {
    getComments,
    addComment,
    toggleCommentLike,
    deleteComment,
    type MockComment,
} from '@/lib/mockSocial';

/**
 * Hook to get and manage comments for a target
 */
export function useComments(targetId?: string, targetType?: 'nft' | 'collection') {
    const [comments, setComments] = useState<MockComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchComments = async () => {
        if (!targetId || !targetType) {
            setComments([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getComments(targetId, targetType);
            setComments(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();

        // Poll for new comments every 15 seconds
        const interval = setInterval(fetchComments, 15000);
        return () => clearInterval(interval);
    }, [targetId, targetType]);

    return { comments, isLoading, error, refetch: fetchComments };
}

/**
 * Hook to add a comment
 */
export function useAddComment(onSuccess?: () => void) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const postComment = async (
        author: { address: string; username?: string; avatar?: string },
        content: string,
        targetId: string,
        targetType: 'nft' | 'collection'
    ) => {
        if (!content.trim()) {
            setError(new Error('Comment cannot be empty'));
            return;
        }

        if (content.length > 500) {
            setError(new Error('Comment too long (max 500 characters)'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await addComment(author, content.trim(), targetId, targetType);
            onSuccess?.();
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    return { postComment, isLoading, error };
}

/**
 * Hook to like a comment
 */
export function useLikeComment() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const likeComment = async (commentId: string, userAddress: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await toggleCommentLike(commentId, userAddress);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    return { likeComment, isLoading, error };
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment(onSuccess?: () => void) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const removeComment = async (commentId: string, userAddress: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await deleteComment(commentId, userAddress);
            onSuccess?.();
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    return { removeComment, isLoading, error };
}
