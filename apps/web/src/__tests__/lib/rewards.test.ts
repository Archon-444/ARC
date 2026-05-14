import { buildRewardSnapshot, PREVIEW_SNAPSHOT } from '@/lib/rewards';

describe('buildRewardSnapshot', () => {
  it('returns PREVIEW_SNAPSHOT when user is null and not connected', () => {
    const result = buildRewardSnapshot(null, false);
    expect(result).toBe(PREVIEW_SNAPSHOT);
  });

  it('returns empty snapshot when user is null and connected', () => {
    const result = buildRewardSnapshot(null, true);
    expect(result.level).toBe(1);
    expect(result.xp).toBe(0);
    expect(result.xpToNextLevel).toBe(350);
    expect(result.progress).toBe(0);
    expect(result.rank).toBe(5000);
    expect(result.badges).toEqual([]);
    expect(result.ownedCount).toBe(0);
    expect(result.createdCount).toBe(0);
    expect(result.listingsCount).toBe(0);
    expect(result.purchaseCount).toBe(0);
    expect(result.saleCount).toBe(0);
    expect(result.totalSpent).toBe(0n);
    expect(result.totalEarned).toBe(0n);
    expect(result.totalActivity).toBe(0);
  });

  it('computes correct XP from user activity counts', () => {
    const user = {
      ownedNFTs: [1, 2],        // 2 * 40 = 80
      createdNFTs: [1],          // 1 * 160 = 160
      listings: [1, 2, 3],      // 3 * 60 = 180
      purchases: [1],           // 1 * 90 = 90
      sales: [1, 2],            // 2 * 110 = 220
      totalSpent: '100',
      totalEarned: '200',
    };
    const result = buildRewardSnapshot(user, true);
    // Total XP: 80 + 160 + 180 + 90 + 220 = 730
    expect(result.xp).toBe(730);
  });

  it('computes correct level from XP', () => {
    const user = {
      ownedNFTs: [1, 2],
      createdNFTs: [1],
      listings: [1, 2, 3],
      purchases: [1],
      sales: [1, 2],
      totalSpent: '0',
      totalEarned: '0',
    };
    const result = buildRewardSnapshot(user, true);
    // XP = 730, levelFloor = Math.floor(730 / 350) = 2, level = 3
    expect(result.level).toBe(3);
    // cycleProgress = 730 % 350 = 30
    expect(result.xpToNextLevel).toBe(320); // 350 - 30
    expect(result.progress).toBe(Math.round((30 / 350) * 100)); // ~9
  });

  it('assigns badges based on activity thresholds', () => {
    // User with purchases > 0 -> first_purchase
    // User with createdNFTs > 0 -> early_adopter
    // User with ownedNFTs >= 3 -> collector
    const user = {
      ownedNFTs: [1, 2, 3],
      createdNFTs: [1],
      listings: [],
      purchases: [1],
      sales: [],
      totalSpent: '0',
      totalEarned: '0',
    };
    const result = buildRewardSnapshot(user, true);
    expect(result.badges).toContain('first_purchase');
    expect(result.badges).toContain('early_adopter');
    expect(result.badges).toContain('collector');
  });

  it('handles zero-activity user correctly', () => {
    const user = {
      ownedNFTs: [],
      createdNFTs: [],
      listings: [],
      purchases: [],
      sales: [],
      totalSpent: '0',
      totalEarned: '0',
    };
    const result = buildRewardSnapshot(user, true);
    expect(result.level).toBe(1);
    expect(result.xp).toBe(0);
    expect(result.xpToNextLevel).toBe(350);
    expect(result.progress).toBe(0);
    expect(result.badges).toEqual([]);
    expect(result.totalActivity).toBe(0);
  });

  it('does not assign collector badge when owned and created are below threshold', () => {
    const user = {
      ownedNFTs: [1, 2],
      createdNFTs: [1, 2],
      listings: [],
      purchases: [],
      sales: [],
      totalSpent: '0',
      totalEarned: '0',
    };
    const result = buildRewardSnapshot(user, true);
    expect(result.badges).not.toContain('collector');
    expect(result.badges).not.toContain('first_purchase');
    expect(result.badges).toContain('early_adopter');
  });

  it('computes totalActivity as sum of purchases, sales, listings, and creations', () => {
    const user = {
      ownedNFTs: [],
      createdNFTs: [1, 2],
      listings: [1],
      purchases: [1, 2, 3],
      sales: [1],
      totalSpent: '0',
      totalEarned: '0',
    };
    const result = buildRewardSnapshot(user, true);
    // totalActivity = 3 + 1 + 1 + 2 = 7
    expect(result.totalActivity).toBe(7);
  });
});
