/**
 * Circle Wallets API Route
 * POST /api/circle/wallets - Create wallet challenge
 * GET /api/circle/wallets?userId=... - Get user's wallets
 */

import { NextRequest, NextResponse } from 'next/server';
import { callCircleAPI } from '@/lib/circle-api';

export const runtime = 'nodejs';

interface CreateWalletRequest {
  userId: string;
  userToken: string;
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

    if (!body.userId || !body.userToken) {
      return NextResponse.json(
        { error: 'userId and userToken are required' },
        { status: 400 }
      );
    }

    // Create wallet challenge in Circle
    const challenge = await callCircleAPI<WalletChallenge>('/users/wallets', {
      method: 'POST',
      headers: {
        'X-User-Token': body.userToken,
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
        error: error.message || 'Failed to create wallet',
        code: error.circleCode,
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

    if (!userId || !userToken) {
      return NextResponse.json(
        { error: 'userId and userToken are required' },
        { status: 400 }
      );
    }

    // Get user's wallets from Circle
    const response = await callCircleAPI<{ wallets: CircleWallet[] }>(`/wallets?userId=${userId}`, {
      method: 'GET',
      headers: {
        'X-User-Token': userToken,
      },
    });

    return NextResponse.json({
      wallets: response.wallets || [],
    });

  } catch (error: any) {
    console.error('Circle wallet fetch failed:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch wallets',
        code: error.circleCode,
      },
      { status: error.statusCode || 500 }
    );
  }
}
