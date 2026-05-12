import type {
  TokenRiskAssessment,
  RiskLevel,
  RiskRecommendation,
  RiskFactor,
  ScoringWeights,
} from '../types';

export const SCORING_VERSION = 'v1.0.0';
export const WEIGHTS: ScoringWeights = {
  creatorHistory: 0.35,
  contractHealth: 0.25,
  tradingPatterns: 0.2,
  liquidityProgress: 0.2,
};
export const DISCLAIMER =
  'This risk score is a heuristic analysis based on on-chain data. It is not financial advice. ' +
  'Scores may not capture all risks. Always conduct your own research before trading.';

export function computeRiskAssessment(
  token: any,
  creatorTokens: any[],
  tradeMetrics: { buyTrades: any[]; sellTrades: any[] },
  creatorWithdrawals: any[]
): TokenRiskAssessment {
  const redFlags: string[] = [];

  const creatorRisk = assessCreatorRisk(token, creatorTokens, redFlags);
  const contractRisk = assessContractRisk(token, redFlags);
  const tradingRisk = assessTradingRisk(token, tradeMetrics, redFlags);
  const liquidityRisk = assessLiquidityRisk(token, creatorWithdrawals, redFlags);

  const overallScore = Math.round(
    creatorRisk.score * WEIGHTS.creatorHistory +
      contractRisk.score * WEIGHTS.contractHealth +
      tradingRisk.score * WEIGHTS.tradingPatterns +
      liquidityRisk.score * WEIGHTS.liquidityProgress
  );

  const recommendation = getRecommendation(overallScore, redFlags.length);

  return {
    scoringVersion: SCORING_VERSION,
    weights: WEIGHTS,
    overallScore,
    creatorRisk,
    contractRisk,
    liquidityRisk,
    tradingRisk,
    redFlags,
    recommendation,
    disclaimer: DISCLAIMER,
    analyzedAt: Date.now(),
  };
}

export const scoreV1 = computeRiskAssessment;

export function assessCreatorRisk(token: any, creatorTokens: any[], redFlags: string[]): RiskFactor {
  let score = 0;

  const totalCreated = creatorTokens.length;
  const graduated = creatorTokens.filter((t: any) => t.isGraduated).length;
  const notGraduated = totalCreated - graduated;

  if (totalCreated <= 1) {
    score += 35;
  } else if (graduated > 0 && graduated / totalCreated >= 0.5) {
    score += 10;
  } else {
    score += 60;
  }

  if (notGraduated >= 3) {
    redFlags.push(`Creator has ${notGraduated} tokens that never graduated`);
    score += 20;
  }

  if (totalCreated >= 5) {
    const sortedByTime = [...creatorTokens].sort(
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
    details:
      totalCreated <= 1
        ? 'New creator with no prior token history'
        : `Creator has launched ${totalCreated} tokens (${graduated} graduated)`,
  };
}

export function assessContractRisk(token: any, redFlags: string[]): RiskFactor {
  let score = 0;

  const totalSupply = BigInt(token.totalSupply || '0');
  const soldSupply = BigInt(token.soldSupply || '0');

  if (totalSupply > BigInt('1000000000000000000000000000000')) {
    score += 30;
    redFlags.push('Extremely high total supply (>1 trillion tokens)');
  }

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

  if (ageDays < 1) {
    score += 20;
  } else if (ageDays < 7) {
    score += 10;
  }

  score = Math.min(score, 100);

  return {
    score,
    level: scoreToLevel(score),
    details:
      ageDays < 1 ? 'Token launched less than 24 hours ago' : `Token is ${Math.floor(ageDays)} days old`,
  };
}

export function assessTradingRisk(
  token: any,
  tradeMetrics: { buyTrades: any[]; sellTrades: any[] },
  redFlags: string[]
): RiskFactor {
  let score = 0;

  const { buyTrades, sellTrades } = tradeMetrics;
  const totalTrades = buyTrades.length + sellTrades.length;

  if (totalTrades === 0) {
    return {
      score: 40,
      level: 'medium',
      details: 'No trading activity yet',
    };
  }

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
        redFlags.push('Single wallet controls >50% of trading volume');
        break;
      }
    }
  }

  const buyVolume = buyTrades.reduce((sum, t) => sum + BigInt(t.usdcAmount || '0'), 0n);
  const sellVolume = sellTrades.reduce((sum, t) => sum + BigInt(t.usdcAmount || '0'), 0n);

  if (sellVolume > 0n && buyVolume > 0n) {
    const sellToBuyRatio = Number((sellVolume * 100n) / buyVolume);
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

export function assessLiquidityRisk(
  token: any,
  creatorWithdrawals: any[],
  redFlags: string[]
): RiskFactor {
  let score = 0;

  const totalSupply = BigInt(token.totalSupply || '0');
  const soldSupply = BigInt(token.soldSupply || '0');
  const isGraduated = token.isGraduated;

  if (totalSupply > 0n) {
    const progressPercent = Number((soldSupply * 10000n) / totalSupply) / 100;

    if (isGraduated) {
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
      const ageSeconds = Math.floor(Date.now() / 1000) - Number(token.createdAt || 0);
      const ageDays = ageSeconds / 86400;

      if (ageDays > 14 && progressPercent < 10) {
        score += 35;
        redFlags.push('Token stalled below 10% progress for over 14 days');
      } else if (ageDays > 7 && progressPercent < 5) {
        score += 25;
      } else if (progressPercent > 0) {
        score += Math.max(0, 20 - Math.floor(progressPercent / 5));
      } else {
        score += 30;
      }
    }
  }

  score = Math.min(score, 100);

  const progressPct =
    totalSupply > 0n ? (Number((soldSupply * 10000n) / totalSupply) / 100).toFixed(1) : '0';

  return {
    score,
    level: scoreToLevel(score),
    details: isGraduated ? 'Token has graduated (80% supply sold)' : `Graduation progress: ${progressPct}%`,
  };
}

export function scoreToLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  return 'high';
}

export function getRecommendation(overallScore: number, redFlagCount: number): RiskRecommendation {
  if (redFlagCount >= 3 || overallScore >= 76) return 'avoid';
  if (redFlagCount >= 2 || overallScore >= 51) return 'speculative';
  if (overallScore >= 26) return 'moderate_buy';
  return 'safe_buy';
}
