/**
 * CommentSection Component
 *
 * Comment thread for NFTs and Collections
 */

'use client';

import { useState } from 'react';
import { MessageSquare, Heart, Trash2, Send, Loader2 } from 'lucide-react';
import { useComments, useAddComment, useLikeComment, useDeleteComment } from '@/hooks/useComments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatTimeAgo, truncateAddress, cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface CommentSectionProps {
    targetId: string;
    targetType: 'nft' | 'collection';
    currentUserAddress?: string;
    currentUserData?: {
        username?: string;
        avatar?: string;
    };
}

export function CommentSection({
    targetId,
    targetType,
    currentUserAddress,
    currentUserData,
}: CommentSectionProps) {
    const [commentText, setCommentText] = useState('');
    const { comments, isLoading, refetch } = useComments(targetId, targetType);
    const { postComment, isLoading: isPosting } = useAddComment(() => {
        setCommentText('');
        refetch();
    });
    const { likeComment } = useLikeComment();
    const { removeComment } = useDeleteComment(refetch);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserAddress || !commentText.trim()) return;

        await postComment(
            {
                address: currentUserAddress,
                username: currentUserData?.username,
                avatar: currentUserData?.avatar,
            },
            commentText,
            targetId,
            targetType
        );
    };

    const handleLike = async (commentId: string) => {
        if (!currentUserAddress) return;
        await likeComment(commentId, currentUserAddress);
        refetch();
    };

    const handleDelete = async (commentId: string) => {
        if (!currentUserAddress) return;
        await removeComment(commentId, currentUserAddress);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-neutral-500" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    Comments {comments.length > 0 && `(${comments.length})`}
                </h3>
            </div>

            {/* Comment Input */}
            {currentUserAddress ? (
                <Card className="p-4">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex gap-3">
                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                {currentUserData?.avatar ? (
                                    <Image
                                        src={currentUserData.avatar}
                                        alt="Your avatar"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm font-medium text-neutral-500">
                                        {currentUserData?.username?.[0] || truncateAddress(currentUserAddress)[2]}
                                    </div>
                                )}
                            </div>

                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Share your thoughts..."
                                maxLength={500}
                                rows={3}
                                className="flex-1 resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">
                                {commentText.length}/500 characters
                            </span>
                            <Button
                                type="submit"
                                disabled={isPosting || !commentText.trim()}
                                size="sm"
                                className="gap-2"
                            >
                                {isPosting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>Post</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Card>
            ) : (
                <Card className="p-6 text-center">
                    <p className="text-sm text-neutral-500">Connect your wallet to comment</p>
                </Card>
            )}

            {/* Comments List */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="flex gap-3">
                                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                                    <div className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <Card className="p-12 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-3" />
                    <p className="text-sm text-neutral-500">No comments yet. Be the first to comment!</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence>
                        {comments.map((comment) => {
                            const isAuthor =
                                currentUserAddress &&
                                comment.author.address.toLowerCase() === currentUserAddress.toLowerCase();
                            const hasLiked = currentUserAddress && comment.likedBy.includes(currentUserAddress);

                            return (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className="p-4">
                                        <div className="flex gap-3">
                                            {/* Avatar */}
                                            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                {comment.author.avatar ? (
                                                    <Image
                                                        src={comment.author.avatar}
                                                        alt={comment.author.username || 'User'}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-sm font-medium text-neutral-500">
                                                        {comment.author.username?.[0] || truncateAddress(comment.author.address)[2]}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                            {comment.author.username || truncateAddress(comment.author.address)}
                                                        </p>
                                                        <p className="text-xs text-neutral-500">
                                                            {formatTimeAgo(comment.timestamp)}
                                                        </p>
                                                    </div>

                                                    {isAuthor && (
                                                        <button
                                                            onClick={() => handleDelete(comment.id)}
                                                            className="text-neutral-400 hover:text-red-500 transition-colors"
                                                            title="Delete comment"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap break-words">
                                                    {comment.content}
                                                </p>

                                                {/* Actions */}
                                                <div className="mt-3 flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleLike(comment.id)}
                                                        disabled={!currentUserAddress}
                                                        className={cn(
                                                            "flex items-center gap-1.5 text-sm transition-colors",
                                                            hasLiked
                                                                ? "text-red-500"
                                                                : "text-neutral-500 hover:text-red-500",
                                                            !currentUserAddress && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <Heart className={cn("h-4 w-4", hasLiked && "fill-current")} />
                                                        <span>{comment.likes}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
