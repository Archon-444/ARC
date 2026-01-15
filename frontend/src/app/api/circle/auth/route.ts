/**
 * Circle Authentication API Route
 * Generates user tokens using Circle's User-Controlled Wallets SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import { getCircleApiKey } from '@/lib/circle-config';
import { enforceRateLimit, rateLimitResponse, requireSessionUser } from '@/lib/api-guards';
import { isTokenVaultEnabled, storeCircleTokens } from '@/lib/token-vault';

// Initialize Circle SDK client
// Automatically uses testnet or mainnet credentials based on NEXT_PUBLIC_CIRCLE_ENVIRONMENT
const circleClient = initiateUserControlledWalletsClient({
  apiKey: getCircleApiKey(),
});

/**
 * POST /api/circle/auth
 * Generate authentication tokens for Circle Wallet SDK
 *
 * Body: { userId: string, email: string }
 * Returns: { userToken: string, encryptionKey: string, expiresIn: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    const sessionCheck = await requireSessionUser(userId);
    if (sessionCheck.error) {
      return sessionCheck.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 10,
      windowMs: 60_000,
      identifier: userId,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    // Create or ensure user exists in Circle
    try {
      await circleClient.createUser({ userId });
    } catch (error: any) {
      // User might already exist, check if it's a duplicate error
      if (error.response?.status !== 409) {
        throw error;
      }
    }

    // Generate user token
    const tokenResponse = await circleClient.createUserToken({ userId });

    if (!tokenResponse.data) {
      throw new Error('Failed to generate user token');
    }

    const { userToken, encryptionKey } = tokenResponse.data;
    await storeCircleTokens({
      userId,
      userToken,
      encryptionKey,
      expiresAt: Date.now() + 3600 * 1000,
      updatedAt: Date.now(),
    });

    if (isTokenVaultEnabled()) {
      return NextResponse.json({
        success: true,
        expiresIn: 3600,
        vaultMode: true,
      });
    }

    return NextResponse.json({
      success: true,
      userToken,
      encryptionKey,
      expiresIn: 3600, // 1 hour (Circle's default)
      vaultMode: false,
    });
  } catch (error: any) {
    console.error('Circle auth error:', error);

    // Handle specific Circle API errors
    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Circle authentication failed',
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/circle/auth/refresh
 * Refresh expired authentication tokens
 *
 * Query params: ?refreshToken=xxx&deviceId=xxx&userId=xxx
 * Returns: { userToken: string, encryptionKey: string, expiresIn: number }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refreshToken = searchParams.get('refreshToken');
    const deviceId = searchParams.get('deviceId');
    const userId = searchParams.get('userId');

    if (!refreshToken || !deviceId || !userId) {
      return NextResponse.json(
        { error: 'refreshToken, deviceId, and userId are required' },
        { status: 400 }
      );
    }

    const sessionCheck = await requireSessionUser(userId);
    if (sessionCheck.error) {
      return sessionCheck.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 10,
      windowMs: 60_000,
      identifier: userId,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    // Refresh the user token using Circle SDK
    const tokenResponse = await circleClient.refreshUserToken({
      userId,
      refreshToken,
      deviceId,
    });

    if (!tokenResponse.data) {
      throw new Error('Failed to refresh user token');
    }

    const { userToken, encryptionKey } = tokenResponse.data;
    await storeCircleTokens({
      userId,
      userToken,
      encryptionKey,
      refreshToken,
      deviceId,
      expiresAt: Date.now() + 3600 * 1000,
      updatedAt: Date.now(),
    });

    if (isTokenVaultEnabled()) {
      return NextResponse.json({
        success: true,
        expiresIn: 3600,
        vaultMode: true,
      });
    }

    return NextResponse.json({
      success: true,
      userToken,
      encryptionKey,
      expiresIn: 3600,
      vaultMode: false,
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);

    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Token refresh failed',
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}
