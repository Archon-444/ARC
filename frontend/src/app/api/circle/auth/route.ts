/**
 * Circle Authentication API Route
 * Generates user tokens using Circle's User-Controlled Wallets SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getCircleApiKey, getCircleEnvironment } from '@/lib/circle-config';

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

    // Verify the user is authenticated (optional, recommended for production)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Create or ensure user exists in Circle
    try {
      await circleClient.createUser({ userId });
    } catch (error: any) {
      // User might already exist, check if it's a duplicate error
      if (error.response?.status !== 409) {
        throw error;
      }
      // User already exists - continue with token generation
    }

    // Generate user token
    const tokenResponse = await circleClient.createUserToken({ userId });

    if (!tokenResponse.data) {
      throw new Error('Failed to generate user token');
    }

    const { userToken, encryptionKey } = tokenResponse.data;

    return NextResponse.json({
      success: true,
      userToken,
      encryptionKey,
      expiresIn: 3600, // 1 hour (Circle's default)
    });
  } catch (error: any) {
    // Log error server-side only, don't expose details to client
    console.error('Circle auth error:', error.message);

    return NextResponse.json(
      { error: 'Authentication failed', code: 'AUTH_ERROR' },
      { status: error.response?.status || 500 }
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
    // Security: Verify the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

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

    // Security: Verify the session user matches the userId being refreshed (IDOR protection)
    const sessionUserId = (session.user as any)?.userId;
    if (sessionUserId && sessionUserId !== userId) {
      console.warn(`[Security] Token refresh attempt for different user: session=${sessionUserId}, requested=${userId}`);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
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

    return NextResponse.json({
      success: true,
      userToken,
      encryptionKey,
      expiresIn: 3600,
    });
  } catch (error: any) {
    // Log error server-side only, don't expose details to client
    console.error('Token refresh error:', error.message);

    return NextResponse.json(
      { error: 'Token refresh failed', code: 'TOKEN_REFRESH_ERROR' },
      { status: error.response?.status || 500 }
    );
  }
}
