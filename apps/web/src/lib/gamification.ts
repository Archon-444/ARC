/**
 * Gamification System
 *
 * Handles XP, levels, and badges for user engagement
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const XP_REWARDS = {
    PURCHASE_NFT: 50,
    LIST_NFT: 10,
    MAKE_OFFER: 5,
    ACCEPT_OFFER: 25,
    PLACE_BID: 5,
    WIN_AUCTION: 30,
    FIRST_SALE_BONUS: 20,
    DAILY_LOGIN: 5,
} as const;

export const LEVEL_THRESHOLDS = [
    { level: 1, xpRequired: 0 },
    { level: 2, xpRequired: 100 },
    { level: 3, xpRequired: 250 },
    { level: 4, xpRequired: 500 },
    { level: 5, xpRequired: 1000 },
    { level: 6, xpRequired: 1800 },
    { level: 7, xpRequired: 2450 },
    { level: 8, xpRequired: 3200 },
    { level: 9, xpRequired: 4050 },
    { level: 10, xpRequired: 5000 },
    { level: 11, xpRequired: 6050 },
    { level: 12, xpRequired: 7200 },
    { level: 13, xpRequired: 8450 },
    { level: 14, xpRequired: 9800 },
    { level: 15, xpRequired: 11250 },
    { level: 16, xpRequired: 12800 },
    { level: 17, xpRequired: 14450 },
    { level: 18, xpRequired: 16200 },
    { level: 19, xpRequired: 18050 },
    { level: 20, xpRequired: 20000 },
];

export type BadgeId =
    | 'early_adopter'
    | 'collector'
    | 'whale'
    | 'trader'
    | 'offer_master'
    | 'auction_king'
    | 'first_purchase'
    | 'first_sale'
    | 'speed_demon'
    | 'diamond_hands';

export interface Badge {
    id: BadgeId;
    name: string;
    description: string;
    icon: string;
    criteria: {
        type: 'count' | 'value' | 'time' | 'special';
        metric?: string;
        threshold?: number;
    };
}

export const BADGES: Record<BadgeId, Badge> = {
    early_adopter: {
        id: 'early_adopter',
        name: 'Early Adopter',
        description: 'Joined during the first month',
        icon: '🌟',
        criteria: { type: 'time' },
    },
    collector: {
        id: 'collector',
        name: 'Collector',
        description: 'Own 10+ NFTs',
        icon: '🎨',
        criteria: { type: 'count', metric: 'nftsOwned', threshold: 10 },
    },
    whale: {
        id: 'whale',
        name: 'Whale',
        description: 'Own 100+ NFTs',
        icon: '🐋',
        criteria: { type: 'count', metric: 'nftsOwned', threshold: 100 },
    },
    trader: {
        id: 'trader',
        name: 'Trader',
        description: 'Complete 50+ transactions',
        icon: '💼',
        criteria: { type: 'count', metric: 'totalTransactions', threshold: 50 },
    },
    offer_master: {
        id: 'offer_master',
        name: 'Offer Master',
        description: 'Make 100+ offers',
        icon: '🤝',
        criteria: { type: 'count', metric: 'offersMade', threshold: 100 },
    },
    auction_king: {
        id: 'auction_king',
        name: 'Auction King',
        description: 'Win 25+ auctions',
        icon: '👑',
        criteria: { type: 'count', metric: 'auctionsWon', threshold: 25 },
    },
    first_purchase: {
        id: 'first_purchase',
        name: 'First Purchase',
        description: 'Bought your first NFT',
        icon: '🎉',
        criteria: { type: 'special' },
    },
    first_sale: {
        id: 'first_sale',
        name: 'First Sale',
        description: 'Sold your first NFT',
        icon: '💰',
        criteria: { type: 'special' },
    },
    speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete 10 transactions in 24 hours',
        icon: '⚡',
        criteria: { type: 'special' },
    },
    diamond_hands: {
        id: 'diamond_hands',
        name: 'Diamond Hands',
        description: 'Hold an NFT for 6+ months',
        icon: '💎',
        criteria: { type: 'time' },
    },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate level from total XP
 */
export function calculateLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i].xpRequired) {
            return LEVEL_THRESHOLDS[i].level;
        }
    }
    return 1;
}

/**
 * Get XP required for next level
 */
export function getNextLevelXP(currentLevel: number): number {
    const nextLevelData = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);
    if (!nextLevelData) {
        // Max level reached, use formula for higher levels
        return currentLevel * currentLevel * 50;
    }
    return nextLevelData.xpRequired;
}

/**
 * Get XP required for current level
 */
export function getCurrentLevelXP(currentLevel: number): number {
    const levelData = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel);
    return levelData?.xpRequired || 0;
}

/**
 * Calculate progress to next level (0-100)
 */
export function calculateLevelProgress(xp: number): {
    level: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
    xpToNextLevel: number;
} {
    const level = calculateLevel(xp);
    const currentLevelXP = getCurrentLevelXP(level);
    const nextLevelXP = getNextLevelXP(level);
    const xpInCurrentLevel = xp - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    const progress = Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100);
    const xpToNextLevel = nextLevelXP - xp;

    return {
        level,
        currentLevelXP,
        nextLevelXP,
        progress,
        xpToNextLevel,
    };
}

/**
 * Check which badges a user has unlocked
 */
export function checkBadgeUnlocks(userStats: {
    nftsOwned: number;
    totalTransactions: number;
    offersMade: number;
    auctionsWon: number;
    joinedAt: number;
    firstPurchase: boolean;
    firstSale: boolean;
}): BadgeId[] {
    const unlockedBadges: BadgeId[] = [];

    // Check each badge
    Object.values(BADGES).forEach((badge) => {
        let unlocked = false;

        switch (badge.criteria.type) {
            case 'count':
                if (badge.criteria.metric && badge.criteria.threshold) {
                    const value = userStats[badge.criteria.metric as keyof typeof userStats] as number;
                    unlocked = value >= badge.criteria.threshold;
                }
                break;

            case 'time':
                if (badge.id === 'early_adopter') {
                    // Check if joined within first month (example: before Feb 1, 2025)
                    const cutoffDate = new Date('2025-02-01').getTime();
                    unlocked = userStats.joinedAt < cutoffDate;
                }
                break;

            case 'special':
                if (badge.id === 'first_purchase') {
                    unlocked = userStats.firstPurchase;
                } else if (badge.id === 'first_sale') {
                    unlocked = userStats.firstSale;
                }
                // Speed demon and diamond hands would require more complex logic
                break;
        }

        if (unlocked) {
            unlockedBadges.push(badge.id);
        }
    });

    return unlockedBadges;
}

/**
 * Get level color/tier
 */
export function getLevelTier(level: number): {
    name: string;
    color: string;
    gradient: string;
} {
    if (level >= 15) {
        return {
            name: 'Legendary',
            color: 'text-yellow-500',
            gradient: 'from-yellow-400 to-orange-500',
        };
    } else if (level >= 10) {
        return {
            name: 'Epic',
            color: 'text-purple-500',
            gradient: 'from-purple-400 to-pink-500',
        };
    } else if (level >= 5) {
        return {
            name: 'Rare',
            color: 'text-blue-500',
            gradient: 'from-blue-400 to-cyan-500',
        };
    } else {
        return {
            name: 'Common',
            color: 'text-neutral-500',
            gradient: 'from-neutral-400 to-neutral-500',
        };
    }
}
