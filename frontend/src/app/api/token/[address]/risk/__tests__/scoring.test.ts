/**
 * Token Risk Scoring Algorithm Tests
 *
 * Tests the pure scoring functions exported from the risk API route.
 * Covers each risk factor + red flag detection with known scenarios.
 */

import {
  assessCreatorRisk,
  assessContractRisk,
  assessTradingRisk,
  assessLiquidityRisk,
  scoreToLevel,
  getRecommendation,
} from '@/lib/risk-scoring';

// Helper: create a mock token with default values
function mockToken(overrides: Record<string, any> = {}) {
  return {
    totalSupply: '1000000000000000000000000', // 1M tokens (18 decimals)
    soldSupply: '400000000000000000000000', // 400K tokens (40%)
    isGraduated: false,
    createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 30), // 30 days ago
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    graduation: null,
    ...overrides,
  };
}

// Helper: create a mock creator token
function mockCreatorToken(overrides: Record<string, any> = {}) {
  return {
    isGraduated: false,
    createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 60),
    ...overrides,
  };
}

// Helper: create mock trade data
function mockTrades(
  buyCount: number,
  sellCount: number,
  options: {
    buyTraders?: string[];
    sellTraders?: string[];
    buyAmounts?: string[];
    sellAmounts?: string[];
  } = {}
) {
  const defaultTrader = '0xaaaa';
  const defaultAmount = '1000000'; // $1 USDC

  const buyTrades = Array.from({ length: buyCount }, (_, i) => ({
    trader: options.buyTraders?.[i] || `0x${String(i + 1).padStart(4, '0')}`,
    usdcAmount: options.buyAmounts?.[i] || defaultAmount,
    createdAt: String(Math.floor(Date.now() / 1000) - i * 60),
  }));

  const sellTrades = Array.from({ length: sellCount }, (_, i) => ({
    trader: options.sellTraders?.[i] || `0x${String(i + 100).padStart(4, '0')}`,
    usdcAmount: options.sellAmounts?.[i] || defaultAmount,
    createdAt: String(Math.floor(Date.now() / 1000) - i * 60),
  }));

  return { buyTrades, sellTrades };
}

// =============================================
// scoreToLevel
// =============================================

describe('scoreToLevel', () => {
  it('returns low for score 0', () => {
    expect(scoreToLevel(0)).toBe('low');
  });

  it('returns low for score 25', () => {
    expect(scoreToLevel(25)).toBe('low');
  });

  it('returns medium for score 26', () => {
    expect(scoreToLevel(26)).toBe('medium');
  });

  it('returns medium for score 50', () => {
    expect(scoreToLevel(50)).toBe('medium');
  });

  it('returns high for score 51', () => {
    expect(scoreToLevel(51)).toBe('high');
  });

  it('returns high for score 100', () => {
    expect(scoreToLevel(100)).toBe('high');
  });
});

// =============================================
// getRecommendation
// =============================================

describe('getRecommendation', () => {
  it('returns safe_buy for low score with no red flags', () => {
    expect(getRecommendation(10, 0)).toBe('safe_buy');
  });

  it('returns moderate_buy for medium score', () => {
    expect(getRecommendation(30, 0)).toBe('moderate_buy');
  });

  it('returns speculative for high score', () => {
    expect(getRecommendation(55, 0)).toBe('speculative');
  });

  it('returns avoid for very high score', () => {
    expect(getRecommendation(80, 0)).toBe('avoid');
  });

  it('returns speculative when 2 red flags regardless of score', () => {
    expect(getRecommendation(20, 2)).toBe('speculative');
  });

  it('returns avoid when 3+ red flags regardless of score', () => {
    expect(getRecommendation(10, 3)).toBe('avoid');
  });
});

// =============================================
// assessCreatorRisk
// =============================================

describe('assessCreatorRisk', () => {
  it('gives moderate score for brand new creator (first token)', () => {
    const token = mockToken();
    const creatorTokens = [mockCreatorToken()]; // only this token
    const redFlags: string[] = [];

    const result = assessCreatorRisk(token, creatorTokens, redFlags);
    expect(result.score).toBe(35);
    expect(result.level).toBe('medium');
    expect(result.details).toContain('no prior token history');
    expect(redFlags).toHaveLength(0);
  });

  it('gives low score for creator with good track record', () => {
    const token = mockToken();
    const creatorTokens = [
      mockCreatorToken({ isGraduated: true }),
      mockCreatorToken({ isGraduated: true }),
      mockCreatorToken({ isGraduated: false }),
    ];
    const redFlags: string[] = [];

    const result = assessCreatorRisk(token, creatorTokens, redFlags);
    expect(result.score).toBe(10);
    expect(result.level).toBe('low');
    expect(result.details).toContain('3 tokens');
    expect(result.details).toContain('2 graduated');
  });

  it('gives high score for creator with poor track record', () => {
    const token = mockToken();
    const creatorTokens = [
      mockCreatorToken({ isGraduated: false }),
      mockCreatorToken({ isGraduated: false }),
      mockCreatorToken({ isGraduated: false }),
    ];
    const redFlags: string[] = [];

    const result = assessCreatorRisk(token, creatorTokens, redFlags);
    expect(result.score).toBe(80); // 60 (poor track) + 20 (3 non-graduated flag)
    expect(result.level).toBe('high');
    expect(redFlags).toContain('Creator has 3 tokens that never graduated');
  });

  it('flags serial launcher (high frequency)', () => {
    const now = Math.floor(Date.now() / 1000);
    const creatorTokens = Array.from({ length: 6 }, (_, i) => ({
      isGraduated: false,
      createdAt: String(now - i * 3600), // 1 per hour over 6 hours
    }));
    const redFlags: string[] = [];

    const result = assessCreatorRisk(mockToken(), creatorTokens, redFlags);
    expect(redFlags).toContain('Creator launches tokens at a high frequency');
  });

  it('caps score at 100', () => {
    const now = Math.floor(Date.now() / 1000);
    const creatorTokens = Array.from({ length: 10 }, (_, i) => ({
      isGraduated: false,
      createdAt: String(now - i * 3600),
    }));
    const redFlags: string[] = [];

    const result = assessCreatorRisk(mockToken(), creatorTokens, redFlags);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// =============================================
// assessContractRisk
// =============================================

describe('assessContractRisk', () => {
  it('gives low score for mature token with sales', () => {
    const token = mockToken({
      createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 60), // 60 days old
      soldSupply: '500000000000000000000000', // 50%
    });
    const redFlags: string[] = [];

    const result = assessContractRisk(token, redFlags);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.level).toBe('low');
  });

  it('gives higher score for brand new token', () => {
    const token = mockToken({
      createdAt: String(Math.floor(Date.now() / 1000) - 3600), // 1 hour old
    });
    const redFlags: string[] = [];

    const result = assessContractRisk(token, redFlags);
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.details).toContain('less than 24 hours');
  });

  it('flags extremely high supply', () => {
    const token = mockToken({
      totalSupply: '2000000000000000000000000000000', // > 1 trillion
    });
    const redFlags: string[] = [];

    assessContractRisk(token, redFlags);
    expect(redFlags).toContain('Extremely high total supply (>1 trillion tokens)');
  });

  it('penalizes stale tokens with low sales', () => {
    const token = mockToken({
      createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 14), // 14 days old
      soldSupply: '5000000000000000000000', // 0.5%
    });
    const redFlags: string[] = [];

    const result = assessContractRisk(token, redFlags);
    expect(result.score).toBeGreaterThanOrEqual(25);
  });
});

// =============================================
// assessTradingRisk
// =============================================

describe('assessTradingRisk', () => {
  it('returns moderate score for no trades', () => {
    const result = assessTradingRisk(mockToken(), { buyTrades: [], sellTrades: [] }, []);
    expect(result.score).toBe(40);
    expect(result.level).toBe('medium');
    expect(result.details).toBe('No trading activity yet');
  });

  it('gives low score for diverse organic trading', () => {
    const trades = mockTrades(20, 5); // 20 buys from 20 wallets, 5 sells from 5 wallets
    const redFlags: string[] = [];

    const result = assessTradingRisk(mockToken(), trades, redFlags);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(redFlags).toHaveLength(0);
  });

  it('flags trading concentrated among few wallets', () => {
    const trades = mockTrades(5, 3, {
      buyTraders: ['0xaaaa', '0xaaaa', '0xaaaa', '0xbbbb', '0xbbbb'],
      sellTraders: ['0xaaaa', '0xbbbb', '0xaaaa'],
    });
    const redFlags: string[] = [];

    const result = assessTradingRisk(mockToken(), trades, redFlags);
    expect(redFlags).toContain('Trading concentrated among very few wallets');
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it('flags single wallet volume dominance', () => {
    const trades = mockTrades(5, 0, {
      buyTraders: ['0xaaaa', '0xaaaa', '0xaaaa', '0xbbbb', '0xcccc'],
      buyAmounts: ['100000000', '100000000', '100000000', '1000000', '1000000'],
    });
    const redFlags: string[] = [];

    const result = assessTradingRisk(mockToken(), trades, redFlags);
    expect(redFlags).toContain('Single wallet controls >50% of trading volume');
  });

  it('flags heavy sell pressure', () => {
    const trades = mockTrades(5, 15, {
      sellAmounts: Array(15).fill('3000000'), // 3x the buy volume per trade
    });
    const redFlags: string[] = [];

    const result = assessTradingRisk(mockToken(), trades, redFlags);
    expect(redFlags).toContain('Sell volume significantly exceeds buy volume');
  });
});

// =============================================
// assessLiquidityRisk
// =============================================

describe('assessLiquidityRisk', () => {
  it('gives low score for healthy graduated token', () => {
    const token = mockToken({
      isGraduated: true,
      soldSupply: '800000000000000000000000', // 80%
      graduation: {
        creatorReserve: '50000000000', // 50K USDC
        createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 30),
      },
    });
    const redFlags: string[] = [];

    const result = assessLiquidityRisk(token, [], redFlags);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.details).toContain('graduated');
  });

  it('flags rapid creator treasury withdrawal after graduation', () => {
    const gradTime = Math.floor(Date.now() / 1000) - 3600; // graduated 1 hour ago
    const token = mockToken({
      isGraduated: true,
      soldSupply: '800000000000000000000000',
      graduation: {
        creatorReserve: '50000000000', // 50K USDC
        createdAt: String(gradTime),
      },
    });
    const withdrawals = [
      {
        amount: '45000000000', // 45K USDC (90% of reserve)
        reason: 'emergency',
        createdAt: String(gradTime + 1800), // 30 min after graduation
      },
    ];
    const redFlags: string[] = [];

    const result = assessLiquidityRisk(token, withdrawals, redFlags);
    expect(redFlags).toContain('Creator withdrew >80% of treasury within 24h of graduation');
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it('flags stalled token below 10% for 14+ days', () => {
    const token = mockToken({
      createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 20), // 20 days old
      soldSupply: '50000000000000000000000', // 5% of 1M
    });
    const redFlags: string[] = [];

    const result = assessLiquidityRisk(token, [], redFlags);
    expect(redFlags).toContain('Token stalled below 10% progress for over 14 days');
    expect(result.score).toBeGreaterThanOrEqual(35);
  });

  it('gives moderate score for token with no progress', () => {
    const token = mockToken({
      createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 3), // 3 days old
      soldSupply: '0',
    });
    const redFlags: string[] = [];

    const result = assessLiquidityRisk(token, [], redFlags);
    expect(result.score).toBeGreaterThanOrEqual(25);
  });

  it('gives healthy score for actively progressing token', () => {
    const token = mockToken({
      createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 5), // 5 days old
      soldSupply: '300000000000000000000000', // 30%
    });
    const redFlags: string[] = [];

    const result = assessLiquidityRisk(token, [], redFlags);
    expect(result.score).toBeLessThanOrEqual(20);
    expect(redFlags).toHaveLength(0);
  });
});

// =============================================
// Composite Scenarios
// =============================================

describe('composite scoring scenarios', () => {
  it('new token by new creator = moderate overall', () => {
    const token = mockToken({
      createdAt: String(Math.floor(Date.now() / 1000) - 86400 * 2),
      soldSupply: '50000000000000000000000', // 5%
    });
    const creatorTokens = [mockCreatorToken()]; // first token
    const trades = mockTrades(3, 0);
    const redFlags: string[] = [];

    const cr = assessCreatorRisk(token, creatorTokens, redFlags);
    const co = assessContractRisk(token, redFlags);
    const tr = assessTradingRisk(token, trades, redFlags);
    const lr = assessLiquidityRisk(token, [], redFlags);

    const overall = Math.round(cr.score * 0.35 + co.score * 0.25 + tr.score * 0.20 + lr.score * 0.20);
    expect(overall).toBeGreaterThanOrEqual(15); // New creator + recent token = moderate range
    expect(overall).toBeLessThanOrEqual(60);
  });

  it('serial rugger = high risk with multiple red flags', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = mockToken({
      createdAt: String(now - 86400 * 20),
      soldSupply: '10000000000000000000000', // 1%
    });
    const creatorTokens = Array.from({ length: 6 }, (_, i) => ({
      isGraduated: false,
      createdAt: String(now - i * 7200), // 1 every 2 hours
    }));
    const trades = mockTrades(10, 0, {
      buyTraders: Array(10).fill('0xaaaa'), // single wallet
      buyAmounts: Array(10).fill('10000000'),
    });
    const redFlags: string[] = [];

    assessCreatorRisk(token, creatorTokens, redFlags);
    assessContractRisk(token, redFlags);
    assessTradingRisk(token, trades, redFlags);
    assessLiquidityRisk(token, [], redFlags);

    expect(redFlags.length).toBeGreaterThanOrEqual(3);
    expect(getRecommendation(80, redFlags.length)).toBe('avoid');
  });
});
