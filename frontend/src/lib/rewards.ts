import type { BadgeId } from '@/lib/gamification';

export type TabType = 'overview' | 'badges' | 'quests' | 'leaderboard';

export interface RewardSnapshot {
  level: number;
  xp: number;
  xpToNextLevel: number;
  progress: number;
  rank: number;
  badges: BadgeId[];
  ownedCount: number;
  createdCount: number;
  listingsCount: number;
  purchaseCount: number;
  saleCount: number;
  totalSpent: bigint;
  totalEarned: bigint;
  totalActivity: number;
}

export const PREVIEW_SNAPSHOT: RewardSnapshot = {
  level: 7,
  xp: 2450,
  xpToNextLevel: 750,
  progress: 52,
  rank: 1247,
  badges: ['first_purchase', 'early_adopter', 'collector'],
  ownedCount: 8,
  createdCount: 3,
  listingsCount: 3,
  purchaseCount: 5,
  saleCount: 2,
  totalSpent: 0n,
  totalEarned: 0n,
  totalActivity: 10,
};

export const LEADERBOARD = [
  { rank: 1, address: '0x1234...5678', xp: 25000, level: 18, badge: 'whale' },
  { rank: 2, address: '0xabcd...efgh', xp: 22500, level: 17, badge: 'auction_king' },
  { rank: 3, address: '0x9876...5432', xp: 20100, level: 16, badge: 'trader' },
  { rank: 4, address: '0xfedc...ba98', xp: 18750, level: 15, badge: 'collector' },
  { rank: 5, address: '0x5555...6666', xp: 17200, level: 14, badge: 'offer_master' },
];

// TAB_CONFIG lives in RewardsContent.tsx since it references React icon components

export function shortenAddress(address?: string | null) {
  if (!address) return 'No wallet connected';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function buildRewardSnapshot(user: any, isConnected: boolean): RewardSnapshot {
  if (!user) {
    return isConnected
      ? {
          level: 1,
          xp: 0,
          xpToNextLevel: 350,
          progress: 0,
          rank: 5000,
          badges: [],
          ownedCount: 0,
          createdCount: 0,
          listingsCount: 0,
          purchaseCount: 0,
          saleCount: 0,
          totalSpent: 0n,
          totalEarned: 0n,
          totalActivity: 0,
        }
      : PREVIEW_SNAPSHOT;
  }

  const ownedCount = (user.ownedNFTs || []).length;
  const createdCount = (user.createdNFTs || []).length;
  const listingsCount = (user.listings || []).length;
  const purchaseCount = (user.purchases || []).length;
  const saleCount = (user.sales || []).length;
  const totalSpent = BigInt(user.totalSpent || 0);
  const totalEarned = BigInt(user.totalEarned || 0);
  const totalActivity = purchaseCount + saleCount + listingsCount + createdCount;

  const badges: BadgeId[] = [];
  if (purchaseCount > 0) badges.push('first_purchase');
  if (createdCount > 0) badges.push('early_adopter');
  if (ownedCount >= 3 || createdCount >= 3) badges.push('collector');

  const xp =
    ownedCount * 40 +
    createdCount * 160 +
    listingsCount * 60 +
    purchaseCount * 90 +
    saleCount * 110;
  const levelFloor = xp > 0 ? Math.floor(xp / 350) : 0;
  const level = Math.max(1, levelFloor + 1);
  const cycleProgress = xp % 350;

  return {
    level,
    xp,
    xpToNextLevel: cycleProgress === 0 ? 350 : 350 - cycleProgress,
    progress: Math.round((cycleProgress / 350) * 100),
    rank: Math.max(1, 5000 - xp - totalActivity * 25),
    badges,
    ownedCount,
    createdCount,
    listingsCount,
    purchaseCount,
    saleCount,
    totalSpent,
    totalEarned,
    totalActivity,
  };
}
