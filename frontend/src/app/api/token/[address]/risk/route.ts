import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTokenDetail,
  fetchCreatorTokens,
  fetchTokenTradeMetrics,
  fetchCreatorWithdrawals,
} from '@/lib/graphql-client';
import { computeRiskAssessment, SCORING_VERSION } from '@/lib/risk-scoring';
import type { TokenRiskAssessment } from '@/types';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// --- Rate Limiting (per-IP) ---
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 req/min per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => t > now - RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, recent);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  return false;
}

// --- Cache with stampede protection ---
const CACHE = new Map<string, { data: TokenRiskAssessment; expiresAt: number }>();
const inflightRequests = new Map<string, Promise<TokenRiskAssessment>>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Strict address validation
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    // Rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // Check cache (serve fresh if valid)
    const cached = CACHE.get(normalizedAddress);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Stampede protection: if a request is already in-flight for this address, wait for it
    const inflight = inflightRequests.get(normalizedAddress);
    if (inflight) {
      const result = await inflight;
      return NextResponse.json(result);
    }

    // Create the in-flight promise
    const computePromise = computeAndCache(normalizedAddress, cached?.data);
    inflightRequests.set(normalizedAddress, computePromise);

    try {
      const assessment = await computePromise;
      return NextResponse.json(assessment);
    } finally {
      inflightRequests.delete(normalizedAddress);
    }
  } catch (error) {
    console.error('Risk assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to compute risk assessment' },
      { status: 500 }
    );
  }
}

async function computeAndCache(
  normalizedAddress: string,
  staleData: TokenRiskAssessment | undefined
): Promise<TokenRiskAssessment> {
  try {
    // Fetch all data in parallel
    const [token, tradeMetrics] = await Promise.all([
      fetchTokenDetail(normalizedAddress),
      fetchTokenTradeMetrics(normalizedAddress),
    ]);

    if (!token) {
      throw new Error('Token not found');
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

    return assessment;
  } catch (error) {
    // If we have stale data, serve it rather than failing
    if (staleData) return staleData;
    throw error;
  }
}
