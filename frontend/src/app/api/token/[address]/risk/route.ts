import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTokenDetail,
  fetchCreatorTokens,
  fetchTokenTradeMetrics,
  fetchCreatorWithdrawals,
} from '@/lib/graphql-client';
import type { TokenRiskAssessment, RiskLevel, RiskRecommendation, RiskFactor } from '@/types';

const CACHE = new Map<string, { data: TokenRiskAssessment; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const normalizedAddress = address.toLowerCase();

    // Check cache
    const cached = CACHE.get(normalizedAddress);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Fetch all data in parallel
    const [token, tradeMetrics] = await Promise.all([
      fetchTokenDetail(normalizedAddress),
      fetchTokenTradeMetrics(normalizedAddress),
    ]);

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Fetch creator-dependent data
    const creatorAddress = token.creator;
    const [creatorTokens, creatorWithdrawals] = await Promise.all([
      fetchCreatorTokens(creatorAddress),
      token.isGraduated ? fetchCreatorWithdrawals(normalizedAddress) : Promise.resolve([]),
    ]);

    const assessment = computeRiskAssessment(token, creatorTokens, tradeMetrics, creatorWithdrawals);

    // Cache result
    CACHE.set(normalizedAddress, {
      data: assessment,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Risk assessment error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to compute risk assessment' },
      { status: 500 }
    );
  }
}

function computeRiskAssessment(
  token: any,
  creatorTokens: any[],
  tradeMetrics: { buyTrades: any[]; sellTrades: any[] },
  creatorWithdrawals: any[]
): TokenRiskAssessment {
  const redFlags: string[] = [];

  // --- Creator Risk (35% weight) ---
  const creatorRisk = assessCreatorRisk(token, creatorTokens, redFlags);

  // --- Contract/Bonding Curve Risk (25% weight) ---
  const contractRisk = assessContractRisk(token, redFlags);

  // --- Liquidity/Trading Pattern Risk (20% weight) ---
  const tradingRisk = assessTradingRisk(token, tradeMetrics, redFlags);

  // --- Graduation/Progress Risk (15% weight) + Token Age (5% weight) combined as liquidityRisk ---
  const liquidityRisk = assessLiquidityRisk(token, creatorWithdrawals, redFlags);

  // Weighted overall score
  const overallScore = Math.round(
    creatorRisk.score * 0.35 +
    contractRisk.score * 0.25 +
    tradingRisk.score * 0.20 +
    liquidityRisk.score * 0.20
  );

  const recommendation = getRecommendation(overallScore, redFlags.length);

  return {
    overallScore,
    creatorRisk,
    contractRisk,
    liquidityRisk,
    tradingRisk,
    redFlags,
    recommendation,
    analyzedAt: Date.now(),
  };
}

function assessCreatorRisk(token: any, creatorTokens: any[], redFlags: string[]): RiskFactor {
  let score = 0;

  const totalCreated = creatorTokens.length;
  const graduated = creatorTokens.filter((t: any) => t.isGraduated).length;
  const notGraduated = totalCreated - graduated;

  // New creator (no history) — moderate risk
  if (totalCreated <= 1) {
    score += 35;
  } else if (graduated > 0 && graduated / totalCreated >= 0.5) {
    // Good track record
    score += 10;
  } else {
    // Poor track record
    score += 60;
  }

  // Flag: multiple failed tokens
  if (notGraduated >= 3) {
    redFlags.push(`Creator has ${notGraduated} tokens that never graduated`);
    score += 20;
  }

  // Flag: rapid token creation (serial launcher)
  if (totalCreated >= 5) {
    const sortedByTime = creatorTokens.sort(
      (a: any, b: any) => Number(b.createdAt) - Number(a.createdAt)
    );
    const newest = Number(sortedByTime[0]?.createdAt || 0);
    const oldest = Number(sortedByTime[sortedByTime.length - 1]?.createdAt || 0);
    const daysBetween = (newest - oldest) / 86400;
    if (daysBetween > 0 && totalCreated / daysBetween > 1) {
      redFlags.push('Creator launches tokens at a high frequency');
      score += 15;
    }
  }

  score = Math.min(score, 100);

  return {
    score,
    level: scoreToLevel(score),
    details: totalCreated <= 1
      ? 'New creator with no prior token history'
      : `Creator has launched ${totalCreated} tokens (${graduated} graduated)`,
  };
}

function assessContractRisk(token: any, redFlags: string[]): RiskFactor {
  let score = 0;

  const totalSupply = BigInt(token.totalSupply || '0');
  const soldSupply = BigInt(token.soldSupply || '0');

  // Check for extreme supply (potential manipulation)
  if (totalSupply > BigInt('1000000000000000000000000000000')) {
    // > 1 trillion tokens
    score += 30;
    redFlags.push('Extremely high total supply (>1 trillion tokens)');
  }

  // Check if very little supply has been sold relative to age
  const ageSeconds = Math.floor(Date.now() / 1000) - Number(token.createdAt || 0);
  const ageDays = ageSeconds / 86400;

  if (ageDays > 7 && totalSupply > 0n) {
    const soldPercent = Number((soldSupply * 10000n) / totalSupply) / 100;
    if (soldPercent < 1) {
      score += 25;
    } else if (soldPercent < 5) {
      score += 15;
    }
  }

  // Token age factor
  if (ageDays < 1) {
    score += 20; // Very new
  } else if (ageDays < 7) {
    score += 10; // Recent
  }

  score = Math.min(score, 100);

  return {
    score,
    level: scoreToLevel(score),
    details: ageDays < 1
      ? 'Token launched less than 24 hours ago'
      : `Token is ${Math.floor(ageDays)} days old`,
  };
}

function assessTradingRisk(
  token: any,
  tradeMetrics: { buyTrades: any[]; sellTrades: any[] },
  redFlags: string[]
): RiskFactor {
  let score = 0;

  const { buyTrades, sellTrades } = tradeMetrics;
  const totalTrades = buyTrades.length + sellTrades.length;

  // No trades yet
  if (totalTrades === 0) {
    return {
      score: 40,
      level: 'medium',
      details: 'No trading activity yet',
    };
  }

  // Unique traders analysis
  const allTraders = new Set([
    ...buyTrades.map((t) => t.trader.toLowerCase()),
    ...sellTrades.map((t) => t.trader.toLowerCase()),
  ]);

  if (allTraders.size <= 2 && totalTrades >= 5) {
    score += 40;
    redFlags.push('Trading concentrated among very few wallets');
  } else if (allTraders.size <= 5 && totalTrades >= 10) {
    score += 20;
  }

  // Volume concentration — check if any single trader dominates
  const traderVolume = new Map<string, bigint>();
  let totalVolume = 0n;

  for (const trade of [...buyTrades, ...sellTrades]) {
    const trader = trade.trader.toLowerCase();
    const amount = BigInt(trade.usdcAmount || '0');
    traderVolume.set(trader, (traderVolume.get(trader) || 0n) + amount);
    totalVolume += amount;
  }

  if (totalVolume > 0n) {
    for (const [, volume] of traderVolume) {
      const pct = Number((volume * 100n) / totalVolume);
      if (pct > 50) {
        score += 30;
        redFlags.push(`Single wallet controls >50% of trading volume`);
        break;
      }
    }
  }

  // Buy/sell ratio — heavy selling is a warning sign
  const buyVolume = buyTrades.reduce((sum, t) => sum + BigInt(t.usdcAmount || '0'), 0n);
  const sellVolume = sellTrades.reduce((sum, t) => sum + BigInt(t.usdcAmount || '0'), 0n);

  if (sellVolume > 0n && buyVolume > 0n) {
    const sellToBuyRatio = Number(sellVolume * 100n / buyVolume);
    if (sellToBuyRatio > 200) {
      score += 20;
      redFlags.push('Sell volume significantly exceeds buy volume');
    }
  }

  score = Math.min(score, 100);

  return {
    score,
    level: scoreToLevel(score),
    details: `${allTraders.size} unique traders, ${totalTrades} total trades`,
  };
}

function assessLiquidityRisk(
  token: any,
  creatorWithdrawals: any[],
  redFlags: string[]
): RiskFactor {
  let score = 0;

  const totalSupply = BigInt(token.totalSupply || '0');
  const soldSupply = BigInt(token.soldSupply || '0');
  const isGraduated = token.isGraduated;

  // Graduation progress
  if (totalSupply > 0n) {
    const progressPercent = Number((soldSupply * 10000n) / totalSupply) / 100;

    if (isGraduated) {
      // Graduated — check creator withdrawal patterns
      const graduation = token.graduation;
      if (graduation && creatorWithdrawals.length > 0) {
        const creatorReserve = BigInt(graduation.creatorReserve || '0');
        const totalWithdrawn = creatorWithdrawals.reduce(
          (sum: bigint, w: any) => sum + BigInt(w.amount || '0'),
          0n
        );
        if (creatorReserve > 0n) {
          const withdrawnPct = Number((totalWithdrawn * 100n) / creatorReserve);
          if (withdrawnPct > 80) {
            const gradTime = Number(graduation.createdAt || 0);
            const latestWithdrawal = Number(creatorWithdrawals[0]?.createdAt || 0);
            const hoursSinceGrad = (latestWithdrawal - gradTime) / 3600;
            if (hoursSinceGrad < 24) {
              score += 40;
              redFlags.push('Creator withdrew >80% of treasury within 24h of graduation');
            } else {
              score += 15;
            }
          }
        }
      }
    } else {
      // Not graduated — assess progress health
      const ageSeconds = Math.floor(Date.now() / 1000) - Number(token.createdAt || 0);
      const ageDays = ageSeconds / 86400;

      if (ageDays > 14 && progressPercent < 10) {
        score += 35;
        redFlags.push('Token stalled below 10% progress for over 14 days');
      } else if (ageDays > 7 && progressPercent < 5) {
        score += 25;
      } else if (progressPercent > 0) {
        // Healthy progression
        score += Math.max(0, 20 - Math.floor(progressPercent / 5));
      } else {
        score += 30; // No progress at all
      }
    }
  }

  score = Math.min(score, 100);

  const progressPct = totalSupply > 0n
    ? (Number((soldSupply * 10000n) / totalSupply) / 100).toFixed(1)
    : '0';

  return {
    score,
    level: scoreToLevel(score),
    details: isGraduated
      ? 'Token has graduated (80% supply sold)'
      : `Graduation progress: ${progressPct}%`,
  };
}

function scoreToLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  return 'high';
}

function getRecommendation(overallScore: number, redFlagCount: number): RiskRecommendation {
  if (redFlagCount >= 3 || overallScore >= 76) return 'avoid';
  if (redFlagCount >= 2 || overallScore >= 51) return 'speculative';
  if (overallScore >= 26) return 'moderate_buy';
  return 'safe_buy';
}
