/**
 * Circle Smart Contract Platform API Route
 * Handles smart contract deployment using Circle's infrastructure
 */

import { NextRequest, NextResponse } from 'next/server';
import { initiateSmartContractPlatformClient } from '@circle-fin/smart-contract-platform';
import { getCircleApiKey, getCircleEntitySecret } from '@/lib/circle-config';
import { enforceRateLimit, rateLimitResponse, requireSessionUser } from '@/lib/api-guards';

// Initialize Circle Smart Contract Platform client
// Automatically uses testnet or mainnet credentials based on NEXT_PUBLIC_CIRCLE_ENVIRONMENT
const scpClient = initiateSmartContractPlatformClient({
  apiKey: getCircleApiKey(),
  entitySecret: getCircleEntitySecret(),
});

/**
 * POST /api/circle/contracts
 * Deploy a new smart contract using Circle's infrastructure
 *
 * Body: {
 *   name: string,
 *   description?: string,
 *   walletId: string,  // Developer-controlled wallet ID
 *   abiJson: string,   // Contract ABI as JSON string
 *   bytecode: string,  // Compiled contract bytecode
 *   constructorParameters?: any[],  // Constructor parameters
 *   feeLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
 * }
 *
 * Returns: { success: boolean, contractId: string, deploymentStatus: string }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCheck = await requireSessionUser();
    if (sessionCheck.error) {
      return sessionCheck.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 5,
      windowMs: 60_000,
      identifier: sessionCheck.sessionUserId,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const {
      name,
      description,
      walletId,
      abiJson,
      bytecode,
      constructorParameters = [],
      feeLevel = 'MEDIUM',
    } = await request.json();

    // Validate required fields
    if (!name || !walletId || !abiJson || !bytecode) {
      return NextResponse.json(
        { error: 'name, walletId, abiJson, and bytecode are required' },
        { status: 400 }
      );
    }

    // Deploy contract via Circle Smart Contract Platform
    const response = await scpClient.deployContract({
      name,
      description: description || 'Contract deployed via ARC',
      walletId,
      abiJson,
      bytecode,
      constructorParameters,
      feeLevel,
    });

    if (!response.data) {
      throw new Error('Failed to deploy contract');
    }

    return NextResponse.json({
      success: true,
      contractId: response.data.id,
      deploymentStatus: response.data.deployStatus,
      transactionHash: response.data.transactionHash,
      contractAddress: response.data.contractAddress,
    });
  } catch (error: any) {
    console.error('Circle contract deployment error:', error);

    // Handle specific Circle API errors
    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Contract deployment failed',
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Contract deployment failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/circle/contracts
 * Get deployed contract status
 *
 * Query params: ?contractId=xxx
 * Returns: { success: boolean, contract: ContractDetails }
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCheck = await requireSessionUser();
    if (sessionCheck.error) {
      return sessionCheck.error;
    }

    const rateLimit = enforceRateLimit(request, {
      limit: 30,
      windowMs: 60_000,
      identifier: sessionCheck.sessionUserId,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contractId');

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId is required' },
        { status: 400 }
      );
    }

    // Get contract details from Circle
    const response = await scpClient.getContract({ id: contractId });

    if (!response.data) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contract: response.data.contract,
    });
  } catch (error: any) {
    console.error('Circle contract retrieval error:', error);

    if (error.response?.data) {
      return NextResponse.json(
        {
          error: 'Failed to retrieve contract',
        },
        { status: error.response.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve contract' },
      { status: 500 }
    );
  }
}
