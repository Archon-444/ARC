/**
 * Circle Wallet Management API Route
 * Handles wallet creation, retrieval, and management using Circle SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import { getCircleApiKey } from '@/lib/circle-config';
import { enforceRateLimit, rateLimitResponse, requireSessionUser } from '@/lib/api-guards';
import { getCircleTokens, isTokenVaultEnabled } from '@/lib/token-vault';

// Initialize Circle SDK client
// Automatically uses testnet or mainnet credentials based on NEXT_PUBLIC_CIRCLE_ENVIRONMENT
const circleClient = initiateUserControlledWalletsClient({
  apiKey: getCircleApiKey(),
});

/**
 * POST /api/circle/wallet
 * Create a new Circle wallet for a user
 *
 * Body: { userId: string, userToken: string, blockchains?: string[], accountType?: string }
 * Returns: { success: boolean, wallet: CircleWallet, challengeId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, userToken, blockchains = ['ETH'], accountType = 'EOA' } = await request.json();

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
      limit: 15,
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

    // Create wallet using Circle SDK
    // This returns a challenge ID that must be completed via PIN entry
    const walletResponse = await circleClient.createWallet({
      userToken: effectiveUserToken,
      blockchains,
      accountType,
    });

    if (!walletResponse.data) {
      throw new Error('Failed to create wallet');
    }

    const { challengeId } = walletResponse.data;

    if (isTokenVaultEnabled()) {
      const challengeTokenResponse = await circleClient.createUserToken({ userId });
      if (!challengeTokenResponse.data) {
        throw new Error('Failed to generate challenge token');
      }

      return NextResponse.json({
        success: true,
        challengeId,
        challengeToken: challengeTokenResponse.data.userToken,
        challengeEncryptionKey: challengeTokenResponse.data.encryptionKey,
        challengeExpiresIn: 300,
        message: 'Wallet creation challenge created. User must complete PIN setup.',
      });
    }

    return NextResponse.json({
      success: true,
      challengeId,
      message: 'Wallet creation challenge created. User must complete PIN setup.',
    });
  } catch (error: any) {
    console.error('Circle wallet creation error:', error);

    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Wallet creation failed',
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Wallet creation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/circle/wallet
 * Retrieve wallet information
 *
 * Query params: ?userToken=xxx (lists all wallets for user) OR ?userToken=xxx&walletId=xxx (get specific wallet)
 * Returns: { success: boolean, wallets: CircleWallet[] } or { success: boolean, wallet: CircleWallet }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userToken = searchParams.get('userToken');
    const walletId = searchParams.get('walletId');
    const userId = searchParams.get('userId');

    if (!userToken && !userId && !isTokenVaultEnabled()) {
      return NextResponse.json(
        { error: 'userToken or userId is required' },
        { status: 400 }
      );
    }

    const sessionCheck = await requireSessionUser(userId || undefined);
    if (sessionCheck.error) {
      return sessionCheck.error;
    }

    const effectiveUserId = userId || sessionCheck.sessionUserId || undefined;

    const rateLimit = enforceRateLimit(request, {
      limit: 30,
      windowMs: 60_000,
      identifier: effectiveUserId,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const effectiveUserToken = isTokenVaultEnabled()
      ? (await getCircleTokens(effectiveUserId || ''))?.userToken
      : userToken || undefined;

    if (isTokenVaultEnabled() && !effectiveUserToken) {
      return NextResponse.json(
        { error: 'Circle authentication required' },
        { status: 401 }
      );
    }

    // If walletId is provided, get specific wallet
    if (walletId) {
      const walletResponse = await circleClient.getWallet({
        id: walletId,
        userToken: effectiveUserToken,
        userId: effectiveUserId,
      } as any);

      if (!walletResponse.data) {
        return NextResponse.json(
          { error: 'Wallet not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        wallet: walletResponse.data.wallet,
      });
    }

    // Otherwise, list all wallets for the user
    const walletsResponse = await circleClient.listWallets({
      userToken: effectiveUserToken,
      userId: effectiveUserId,
    } as any);

    if (!walletsResponse.data) {
      return NextResponse.json(
        { error: 'Failed to retrieve wallets' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wallets: walletsResponse.data.wallets || [],
    });
  } catch (error: any) {
    console.error('Circle wallet retrieval error:', error);

    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Failed to retrieve wallet',
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve wallet' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/circle/wallet
 * Update wallet information
 *
 * Body: { walletId: string, userToken: string, name?: string, refId?: string }
 * Returns: { success: boolean, wallet: CircleWallet }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { walletId, userToken, userId, name, refId } = await request.json();

    if (!walletId || (!userToken && !userId && !isTokenVaultEnabled())) {
      return NextResponse.json(
        { error: 'walletId and (userToken or userId) are required' },
        { status: 400 }
      );
    }

    const sessionCheck = await requireSessionUser(userId || undefined);
    if (sessionCheck.error) {
      return sessionCheck.error;
    }

    const effectiveUserId = userId || sessionCheck.sessionUserId || undefined;

    const rateLimit = enforceRateLimit(request, {
      limit: 20,
      windowMs: 60_000,
      identifier: effectiveUserId,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const effectiveUserToken = isTokenVaultEnabled()
      ? (await getCircleTokens(effectiveUserId || ''))?.userToken
      : userToken || undefined;

    if (isTokenVaultEnabled() && !effectiveUserToken) {
      return NextResponse.json(
        { error: 'Circle authentication required' },
        { status: 401 }
      );
    }

    // Update wallet using Circle SDK
    const walletResponse = await circleClient.updateWallet({
      id: walletId,
      userToken: effectiveUserToken,
      userId: effectiveUserId,
      name,
      refId,
    } as any);

    if (!walletResponse.data) {
      throw new Error('Failed to update wallet');
    }

    return NextResponse.json({
      success: true,
      wallet: walletResponse.data.wallet,
    });
  } catch (error: any) {
    console.error('Circle wallet update error:', error);

    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Wallet update failed',
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Wallet update failed' },
      { status: 500 }
    );
  }
}
