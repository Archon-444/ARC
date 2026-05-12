import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTokenDetail,
  fetchCreatorTokens,
  fetchTokenTradeMetrics,
  fetchCreatorWithdrawals,
} from '@/lib/graphql-client';
import {
  computeRiskAssessment,
  TtlCache,
  InMemoryRateLimiter,
  DEFAULT_TRUST_CACHE_TTL_MS,
  DEFAULT_TRUST_RATE_LIMIT,
  type TokenRiskAssessment,
} from '@arc/trust-core';

const cache = new TtlCache<TokenRiskAssessment>({ ttlMs: DEFAULT_TRUST_CACHE_TTL_MS });
const limiter = new InMemoryRateLimiter(DEFAULT_TRUST_RATE_LIMIT);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (limiter.isLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    const assessment = await cache.withCache(normalizedAddress, async () => {
      const [token, tradeMetrics] = await Promise.all([
        fetchTokenDetail(normalizedAddress),
        fetchTokenTradeMetrics(normalizedAddress),
      ]);

      if (!token) {
        throw new Error('Token not found');
      }

      const creatorAddress = token.creator;
      const [creatorTokens, creatorWithdrawals] = await Promise.all([
        fetchCreatorTokens(creatorAddress),
        token.isGraduated ? fetchCreatorWithdrawals(normalizedAddress) : Promise.resolve([]),
      ]);

      return computeRiskAssessment(token, creatorTokens, tradeMetrics, creatorWithdrawals);
    });

    return NextResponse.json(assessment);
  } catch (error: any) {
    if (error?.message === 'Token not found') {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    console.error('Risk assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to compute risk assessment' },
      { status: 500 }
    );
  }
}
