/**
 * Circle Transaction API Route
 * Handles transaction execution via Circle wallets
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getCircleApiKey } from '@/lib/circle-config';

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HEX_DATA_REGEX = /^0x[a-fA-F0-9]*$/;
const TX_HASH_REGEX = /^0x([A-Fa-f0-9]{64})$/;

type ParsedBody<T> =
  | { ok: true; value: T }
  | { ok: false; error: NextResponse };

async function parseJsonBody<T>(request: NextRequest): Promise<ParsedBody<T>> {
  try {
    const value = (await request.json()) as T;
    return { ok: true, value };
  } catch (error) {
    console.error('Failed to parse JSON body:', error);
    return {
      ok: false,
      error: NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 }),
    };
  }
}

function isPositiveNumericString(value: unknown): value is string {
  return typeof value === 'string' && /^\d+(\.\d+)?$/.test(value);
}

function isOptionalHexData(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && HEX_DATA_REGEX.test(value));
}

function isOptionalGasLimit(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && /^\d+$/.test(value));
}

function isOptionalBlockchain(value: unknown): value is string | undefined {
  return (
    value === undefined ||
    (typeof value === 'string' && /^[A-Z0-9-]{1,50}$/.test(value.trim()))
  );
}

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
    const parsedBody = await parseJsonBody<{
      walletId?: unknown;
      to?: unknown;
      value?: unknown;
      data?: unknown;
      gasLimit?: unknown;
      blockchain?: unknown;
    }>(request);

    if (!parsedBody.ok) {
      return parsedBody.error;
    }

    const { walletId, to, value, data, gasLimit, blockchain } = parsedBody.value;

    // Validate required fields
    if (typeof walletId !== 'string' || typeof to !== 'string') {
      return NextResponse.json(
        { error: 'walletId and to address are required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!ETH_ADDRESS_REGEX.test(to)) {
      return NextResponse.json(
        { error: 'Invalid to address' },
        { status: 400 }
      );
    }

    if (value !== undefined && !isPositiveNumericString(value)) {
      return NextResponse.json(
        { error: 'value must be a positive numeric string when provided' },
        { status: 400 }
      );
    }

    if (!isOptionalHexData(data)) {
      return NextResponse.json(
        { error: 'data must be a hex-encoded string starting with 0x' },
        { status: 400 }
      );
    }

    if (!isOptionalGasLimit(gasLimit)) {
      return NextResponse.json(
        { error: 'gasLimit must be an integer string when provided' },
        { status: 400 }
      );
    }

    if (!isOptionalBlockchain(blockchain)) {
      return NextResponse.json(
        { error: 'blockchain must contain only uppercase letters, numbers, or hyphens' },
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

    const normalizedValue = typeof value === 'string' ? value : '0';
    const normalizedData = typeof data === 'string' && data.length > 0 ? data : '0x';
    const normalizedGasLimit = typeof gasLimit === 'string' ? gasLimit : undefined;
    const normalizedBlockchain =
      typeof blockchain === 'string' && blockchain.trim().length > 0
        ? blockchain.trim()
        : undefined;

    // Create contract execution transaction
    const txResponse = await circleClient.createContractExecutionTransaction({
      walletId,
      contractAddress: to,
      abiFunctionSignature: normalizedData, // Use provided data or empty for simple transfer
      abiParameters: [],
      amount: normalizedValue,
      feeLevel: 'MEDIUM',
      // Use Arc blockchain when available, default to ETH-SEPOLIA for testing
      blockchain: normalizedBlockchain || 'ETH-SEPOLIA',
      gasLimit: normalizedGasLimit,
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

    if (!TX_HASH_REGEX.test(transactionHash)) {
      return NextResponse.json(
        { error: 'transactionHash must be a 0x-prefixed 64-byte hash' },
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
    const parsedBody = await parseJsonBody<{
      walletId?: unknown;
      to?: unknown;
      value?: unknown;
      data?: unknown;
    }>(request);

    if (!parsedBody.ok) {
      return parsedBody.error;
    }

    const { walletId, to, value, data } = parsedBody.value;

    if (typeof walletId !== 'string' || typeof to !== 'string') {
      return NextResponse.json(
        { error: 'walletId and to address are required' },
        { status: 400 }
      );
    }

    if (!ETH_ADDRESS_REGEX.test(to)) {
      return NextResponse.json(
        { error: 'Invalid to address' },
        { status: 400 }
      );
    }

    if (value !== undefined && !isPositiveNumericString(value)) {
      return NextResponse.json(
        { error: 'value must be a positive numeric string when provided' },
        { status: 400 }
      );
    }

    if (!isOptionalHexData(data)) {
      return NextResponse.json(
        { error: 'data must be a hex-encoded string starting with 0x' },
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
