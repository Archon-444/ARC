/**
 * Mock Social Data Service
 *
 * Provides mock data for follow/comments until backend is implemented
 */

export interface MockComment {
    id: string;
    author: {
        address: string;
        username?: string;
        avatar?: string;
    };
    content: string;
    targetId: string;
    targetType: 'nft' | 'collection';
    timestamp: number;
    likes: number;
    likedBy: string[];
}

export interface MockFollow {
    follower: string;
    following: string;
    timestamp: number;
}

// In-memory storage
let comments: MockComment[] = [];
let follows: MockFollow[] = [];

// Generate some initial mock data
const MOCK_USERS = [
    { address: '0x1234...5678', username: 'CryptoWhale', avatar: 'https://i.pravatar.cc/150?img=1' },
    { address: '0xabcd...efgh', username: 'NFTCollector', avatar: 'https://i.pravatar.cc/150?img=2' },
    { address: '0x9876...5432', username: 'ArtEnthusiast', avatar: 'https://i.pravatar.cc/150?img=3' },
];

const MOCK_COMMENTS_DATA: Array<Omit<MockComment, 'id' | 'likedBy'>> = [
    {
        author: MOCK_USERS[0],
        content: 'This is an amazing piece! Love the artwork 🎨',
        targetId: 'nft-1',
        targetType: 'nft',
        timestamp: Date.now() - 3600000,
        likes: 5,
    },
    {
        author: MOCK_USERS[1],
        content: 'Great collection! Are you planning to mint more?',
        targetId: 'col-1',
        targetType: 'collection',
        timestamp: Date.now() - 7200000,
        likes: 2,
    },
    {
        author: MOCK_USERS[2],
        content: 'Just added this to my collection 🔥',
        targetId: 'nft-1',
        targetType: 'nft',
        timestamp: Date.now() - 10800000,
        likes: 8,
    },
];

// Initialize with mock data
comments = MOCK_COMMENTS_DATA.map((c, i) => ({
    ...c,
    id: `comment-${i}`,
    likedBy: [],
}));

// ============================================================================
// MOCK API FUNCTIONS
// ============================================================================

/**
 * Get comments for a target (NFT or Collection)
 */
export function getComments(targetId: string, targetType: 'nft' | 'collection'): Promise<MockComment[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const filtered = comments
                .filter((c) => c.targetId === targetId && c.targetType === targetType)
                .sort((a, b) => b.timestamp - a.timestamp);
            resolve(filtered);
        }, 300);
    });
}

/**
 * Add a comment
 */
export function addComment(
    author: { address: string; username?: string; avatar?: string },
    content: string,
    targetId: string,
    targetType: 'nft' | 'collection'
): Promise<MockComment> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newComment: MockComment = {
                id: `comment-${Date.now()}`,
                author,
                content,
                targetId,
                targetType,
                timestamp: Date.now(),
                likes: 0,
                likedBy: [],
            };
            comments.push(newComment);
            resolve(newComment);
        }, 500);
    });
}

/**
 * Like/unlike a comment
 */
export function toggleCommentLike(commentId: string, userAddress: string): Promise<MockComment> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const comment = comments.find((c) => c.id === commentId);
            if (!comment) {
                reject(new Error('Comment not found'));
                return;
            }

            const likedIndex = comment.likedBy.indexOf(userAddress);
            if (likedIndex > -1) {
                // Unlike
                comment.likedBy.splice(likedIndex, 1);
                comment.likes = Math.max(0, comment.likes - 1);
            } else {
                // Like
                comment.likedBy.push(userAddress);
                comment.likes += 1;
            }

            resolve(comment);
        }, 300);
    });
}

/**
 * Delete a comment (only if user is author)
 */
export function deleteComment(commentId: string, userAddress: string): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const commentIndex = comments.findIndex((c) => c.id === commentId);
            if (commentIndex === -1) {
                reject(new Error('Comment not found'));
                return;
            }

            const comment = comments[commentIndex];
            if (comment.author.address.toLowerCase() !== userAddress.toLowerCase()) {
                reject(new Error('Unauthorized'));
                return;
            }

            comments.splice(commentIndex, 1);
            resolve();
        }, 300);
    });
}

/**
 * Follow a user
 */
export function followUser(follower: string, following: string): Promise<MockFollow> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const existingFollow = follows.find(
                (f) => f.follower.toLowerCase() === follower.toLowerCase() &&
                    f.following.toLowerCase() === following.toLowerCase()
            );

            if (!existingFollow) {
                const newFollow: MockFollow = {
                    follower,
                    following,
                    timestamp: Date.now(),
                };
                follows.push(newFollow);
                resolve(newFollow);
            } else {
                resolve(existingFollow);
            }
        }, 300);
    });
}

/**
 * Unfollow a user
 */
export function unfollowUser(follower: string, following: string): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const index = follows.findIndex(
                (f) => f.follower.toLowerCase() === follower.toLowerCase() &&
                    f.following.toLowerCase() === following.toLowerCase()
            );
            if (index > -1) {
                follows.splice(index, 1);
            }
            resolve();
        }, 300);
    });
}

/**
 * Check if user is following another user
 */
export function isFollowing(follower: string, following: string): Promise<boolean> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const exists = follows.some(
                (f) => f.follower.toLowerCase() === follower.toLowerCase() &&
                    f.following.toLowerCase() === following.toLowerCase()
            );
            resolve(exists);
        }, 200);
    });
}

/**
 * Get followers of a user
 */
export function getFollowers(userAddress: string): Promise<string[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const followers = follows
                .filter((f) => f.following.toLowerCase() === userAddress.toLowerCase())
                .map((f) => f.follower);
            resolve(followers);
        }, 300);
    });
}

/**
 * Get users that a user is following
 */
export function getFollowing(userAddress: string): Promise<string[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const following = follows
                .filter((f) => f.follower.toLowerCase() === userAddress.toLowerCase())
                .map((f) => f.following);
            resolve(following);
        }, 300);
    });
}

/**
 * Get follower/following counts
 */
export function getFollowCounts(userAddress: string): Promise<{ followers: number; following: number }> {
    return new Promise((resolve) => {
        setTimeout(async () => {
            const followers = await getFollowers(userAddress);
            const following = await getFollowing(userAddress);
            resolve({
                followers: followers.length,
                following: following.length,
            });
        }, 200);
    });
}
