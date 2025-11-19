/**
 * Circle Transaction API Route
 * Handles transaction execution via Circle wallets
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getCircleApiKey } from '@/lib/circle-config';

// Initialize Circle SDK client
const circleClient = initiateUserControlledWalletsClient({
  apiKey: getCircleApiKey(),
});

/**
 * POST /api/circle/transaction
 * Execute a transaction using Circle wallet
 *
 * Body: {
 *   walletId: string,
 *   to: string,
 *   value: string,
 *   data?: string,
 *   gasLimit?: string,
 *   blockchain?: string
 * }
 * Returns: { challengeId: string, transactionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { walletId, to, value, data, gasLimit, blockchain } = await request.json();

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

    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Verify wallet ownership (optional, recommended)
    try {
      const walletResponse = await circleClient.getWallet({ id: walletId });
      if (!walletResponse.data?.wallet) {
        return NextResponse.json(
          { error: 'Wallet not found' },
          { status: 404 }
        );
      }
    } catch (error: any) {
      console.error('Failed to verify wallet:', error);
      return NextResponse.json(
        { error: 'Failed to verify wallet ownership' },
        { status: 403 }
      );
    }

    // Create contract execution transaction
    const txResponse = await circleClient.createContractExecutionTransaction({
      walletId,
      contractAddress: to,
      abiFunctionSignature: data || '0x', // Use provided data or empty for simple transfer
      abiParameters: [],
      amount: value || '0',
      feeLevel: 'MEDIUM',
      // Use Arc blockchain when available, default to ETH-SEPOLIA for testing
      blockchain: blockchain || 'ETH-SEPOLIA',
    });

    if (!txResponse.data) {
      throw new Error('Failed to create transaction');
    }

    const { challengeId, transaction } = txResponse.data;

    console.log(`📤 Circle transaction created from wallet ${walletId}`);
    console.log(`   To: ${to}`);
    console.log(`   Value: ${value || '0'}`);
    console.log(`   Challenge ID: ${challengeId}`);
    console.log(`   Transaction ID: ${transaction?.id}`);

    return NextResponse.json({
      success: true,
      challengeId,
      transactionId: transaction?.id,
      wallet: walletId,
      status: 'PENDING_CHALLENGE',
      estimatedConfirmationTime: '< 1 second', // Arc's fast finality
    });
  } catch (error: any) {
    console.error('Circle transaction error:', error);

    // Handle specific Circle API errors
    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Transaction creation failed',
          details: error.response.data
        },
        { status: error.response.status || 500 }
      );
    }

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
    const { searchParams } = new URL(request.url);
    const transactionHash = searchParams.get('transactionHash');

    if (!transactionHash) {
      return NextResponse.json(
        { error: 'transactionHash is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual transaction status check
    // For production, call Circle API or Arc blockchain RPC

    // Mock transaction status
    const transaction = {
      transactionHash,
      status: 'CONFIRMED',
      confirmations: 1,
      blockNumber: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      gasUsed: '21000',
      effectiveGasPrice: '1000000000', // 1 gwei
    };

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Transaction status check error:', error);
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
    const { walletId, to, value, data } = await request.json();

    if (!walletId || !to) {
      return NextResponse.json(
        { error: 'walletId and to address are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual gas estimation
    // For production, call Arc RPC or Circle API

    // Mock gas estimation
    const gasLimit = data ? '100000' : '21000';
    const gasPrice = '1000000000'; // 1 gwei
    const estimatedCost = (BigInt(gasLimit) * BigInt(gasPrice)).toString();

    // Convert to USDC (Arc uses USDC for gas)
    const estimatedCostUSDC = (Number(estimatedCost) / 1e18).toFixed(6);

    return NextResponse.json({
      success: true,
      gasLimit,
      gasPrice,
      estimatedCost,
      estimatedCostUSDC: `${estimatedCostUSDC} USDC`,
    });
  } catch (error) {
    console.error('Gas estimation error:', error);
    return NextResponse.json(
      { error: 'Gas estimation failed' },
      { status: 500 }
    );
  }
}
