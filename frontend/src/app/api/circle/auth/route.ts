/**
 * Circle Authentication API Route
 * Generates user tokens using Circle's User-Controlled Wallets SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// Initialize Circle SDK client
const circleClient = initiateUserControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY || '',
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
      console.log(`✅ Circle user created/verified: ${userId}`);
    } catch (error: any) {
      // User might already exist, check if it's a duplicate error
      if (error.response?.status !== 409) {
        throw error;
      }
      console.log(`ℹ️  Circle user already exists: ${userId}`);
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
    console.error('Circle auth error:', error);

    // Handle specific Circle API errors
    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Circle authentication failed',
          details: error.response.data
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
    console.error('Token refresh error:', error);

    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Token refresh failed',
          details: error.response.data
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
