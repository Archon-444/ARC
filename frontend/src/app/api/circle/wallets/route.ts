/**
 * Circle Wallets API Route
 * POST /api/circle/wallets - Create wallet challenge
 * GET /api/circle/wallets?userId=... - Get user's wallets
 */

import { NextRequest, NextResponse } from 'next/server';
import { callCircleAPI } from '@/lib/circle-api';
import { enforceRateLimit, rateLimitResponse, requireSessionUser } from '@/lib/api-guards';
import { getCircleTokens, isTokenVaultEnabled } from '@/lib/token-vault';

export const runtime = 'nodejs';

interface CreateWalletRequest {
  userId: string;
  userToken?: string;
  blockchain?: string;
}

interface WalletChallenge {
  challengeId: string;
  userId: string;
}

interface CircleWallet {
  id: string;
  address: string;
  blockchain: string;
  state: 'LIVE' | 'FROZEN';
  createDate: string;
  updateDate: string;
}

/**
 * POST - Create wallet challenge
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateWalletRequest = await request.json();

    if (!body.userId || (!body.userToken && !isTokenVaultEnabled())) {
      return NextResponse.json(
        { error: 'userId and userToken are required' },
        { status: 400 }
      );
    }

    const sessionCheck = await requireSessionUser(body.userId);
    if (sessionCheck.error) {
      return sessionCheck.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 10,
      windowMs: 60_000,
      identifier: body.userId,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const effectiveUserToken = isTokenVaultEnabled()
      ? (await getCircleTokens(body.userId))?.userToken
      : body.userToken;

    if (!effectiveUserToken) {
      return NextResponse.json(
        { error: 'Circle authentication required' },
        { status: 401 }
      );
    }

    // Create wallet challenge in Circle
    const challenge = await callCircleAPI<WalletChallenge>('/users/wallets', {
      method: 'POST',
      headers: {
        'X-User-Token': effectiveUserToken,
      },
      body: JSON.stringify({
        userId: body.userId,
        blockchains: [body.blockchain || 'MATIC-AMOY'], // Default to Polygon Amoy testnet
        // Note: Arc blockchain may not be supported yet - check Circle docs
        // Use 'MATIC-AMOY' for testing, replace with 'ARC' when available
      }),
    });

    return NextResponse.json({
      challengeId: challenge.challengeId,
      userId: challenge.userId,
    });

  } catch (error: any) {
    console.error('Circle wallet creation failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to create wallet',
        code: error.circleCode || 'CIRCLE_WALLET_CREATE_FAILED',
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * GET - Get user's wallets
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userToken = searchParams.get('userToken');

    if (!userId || (!userToken && !isTokenVaultEnabled())) {
      return NextResponse.json(
        { error: 'userId and userToken are required' },
        { status: 400 }
      );
    }

    const sessionCheck = await requireSessionUser(userId);
    if (sessionCheck.error) {
      return sessionCheck.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 30,
      windowMs: 60_000,
      identifier: userId,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const effectiveUserToken = isTokenVaultEnabled()
      ? (await getCircleTokens(userId))?.userToken
      : userToken;

    if (!effectiveUserToken) {
      return NextResponse.json(
        { error: 'Circle authentication required' },
        { status: 401 }
      );
    }

    // Get user's wallets from Circle
    const response = await callCircleAPI<{ wallets: CircleWallet[] }>(`/wallets?userId=${userId}`, {
      method: 'GET',
      headers: {
        'X-User-Token': effectiveUserToken,
      },
    });

    return NextResponse.json({
      wallets: response.wallets || [],
    });

  } catch (error: any) {
    console.error('Circle wallet fetch failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch wallets',
        code: error.circleCode || 'CIRCLE_WALLET_FETCH_FAILED',
      },
      { status: error.statusCode || 500 }
    );
  }
}
