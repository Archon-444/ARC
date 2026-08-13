/**
 * Circle Transaction API Route
 * Handles transaction execution via Circle wallets
 */

import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit, rateLimitResponse } from '@/lib/api-guards';
import { requireSessionWallet, requireSignature } from '@/lib/auth-middleware';

/**
 * POST /api/circle/transaction
 * Execute a transaction using Circle wallet
 *
 * Body: {
 *   walletId: string,
 *   to: string,
 *   value: string,
 *   data?: string,
 *   gasLimit?: string
 * }
 * Returns: { transactionHash: string, status: string }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionWallet = await requireSessionWallet(request);
    if ('error' in sessionWallet) {
      return sessionWallet.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 15,
      windowMs: 60_000,
      identifier: sessionWallet.address,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const signatureResult = await requireSignature(request, sessionWallet.address, 'CIRCLE_TX_SUBMIT');
    if (signatureResult.error) {
      return signatureResult.error;
    }

    const { walletId, to, _value, _data, _gasLimit } = await request.json();

    // Validate required fields
    if (!walletId || !to) {
      return NextResponse.json(
        { error: 'walletId and to address are required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!to.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: 'Invalid to address' },
        { status: 400 }
      );
    }

    // Circle execution is not wired. Never return a fabricated hash.
    return NextResponse.json(
      {
        error: 'Circle transaction execution is not implemented',
        code: 'NOT_IMPLEMENTED',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Circle transaction error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Transaction failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/circle/transaction
 * Get transaction status
 *
 * Query params: ?transactionHash=0x...
 * Returns: { transaction: CircleTransaction }
 */
export async function GET(request: NextRequest) {
  try {
    const sessionWallet = await requireSessionWallet(request);
    if ('error' in sessionWallet) {
      return sessionWallet.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 30,
      windowMs: 60_000,
      identifier: sessionWallet.address,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const { searchParams } = new URL(request.url);
    const transactionHash = searchParams.get('transactionHash');

    if (!transactionHash) {
      return NextResponse.json(
        { error: 'transactionHash is required' },
        { status: 400 }
      );
    }

    // Circle status lookup is not wired. Never report a fake CONFIRMED receipt.
    return NextResponse.json(
      {
        error: 'Circle transaction status is not implemented',
        code: 'NOT_IMPLEMENTED',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Transaction status check error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to get transaction status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/circle/transaction/estimate
 * Estimate gas for a transaction
 *
 * Body: { walletId: string, to: string, value?: string, data?: string }
 * Returns: { gasLimit: string, gasPrice: string, estimatedCost: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const sessionWallet = await requireSessionWallet(request);
    if ('error' in sessionWallet) {
      return sessionWallet.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 20,
      windowMs: 60_000,
      identifier: sessionWallet.address,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const signatureResult = await requireSignature(
      request,
      sessionWallet.address,
      'CIRCLE_TX_ESTIMATE'
    );
    if (signatureResult.error) {
      return signatureResult.error;
    }

    const { walletId, to } = await request.json();

    if (!walletId || !to) {
      return NextResponse.json(
        { error: 'walletId and to address are required' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Circle gas estimation is not implemented',
        code: 'NOT_IMPLEMENTED',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Gas estimation error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Gas estimation failed' },
      { status: 500 }
    );
  }
}
