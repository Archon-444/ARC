/**
 * Circle Wallet Management API Route
 * Handles wallet creation, retrieval, and management
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock database for development
// TODO: Replace with actual database in production
const walletDatabase: Map<string, any> = new Map();

/**
 * POST /api/circle/wallet
 * Create a new Circle wallet for a user
 *
 * Body: { userId: string, email: string }
 * Returns: { wallet: CircleWallet }
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

    // Check if wallet already exists
    const existingWallet = Array.from(walletDatabase.values()).find(
      (w) => w.userId === userId
    );

    if (existingWallet) {
      return NextResponse.json({
        success: true,
        wallet: existingWallet,
        message: 'Wallet already exists',
      });
    }

    // TODO: Implement actual Circle Wallet creation
    // For production, you would:
    // 1. Verify user authentication
    // 2. Call Circle API to create wallet
    // 3. Store wallet information in database
    // 4. Return wallet details

    // Mock wallet creation
    const wallet = {
      id: `wallet_${Math.random().toString(36).substring(2, 15)}`,
      address: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`,
      userId,
      email,
      createDate: new Date().toISOString(),
      updateDate: new Date().toISOString(),
      accountType: 'EOA', // Externally Owned Account
      blockchain: 'ARC',
      status: 'LIVE',
    };

    // Save to mock database
    walletDatabase.set(wallet.id, wallet);

    console.log(`✅ Created Circle wallet for user ${userId}:`, wallet.address);

    return NextResponse.json({
      success: true,
      wallet,
    });
  } catch (error) {
    console.error('Circle wallet creation error:', error);
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
 * Query params: ?walletId=xxx OR ?address=0x... OR ?userId=xxx
 * Returns: { wallet: CircleWallet }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get('walletId');
    const address = searchParams.get('address');
    const userId = searchParams.get('userId');

    let wallet = null;

    if (walletId) {
      wallet = walletDatabase.get(walletId);
    } else if (address) {
      wallet = Array.from(walletDatabase.values()).find(
        (w) => w.address.toLowerCase() === address.toLowerCase()
      );
    } else if (userId) {
      wallet = Array.from(walletDatabase.values()).find(
        (w) => w.userId === userId
      );
    }

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // TODO: In production, call Circle API to get latest wallet state

    return NextResponse.json({
      success: true,
      wallet,
    });
  } catch (error) {
    console.error('Circle wallet retrieval error:', error);
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
 * Body: { walletId: string, updates: Partial<CircleWallet> }
 * Returns: { wallet: CircleWallet }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { walletId, updates } = await request.json();

    if (!walletId) {
      return NextResponse.json(
        { error: 'walletId is required' },
        { status: 400 }
      );
    }

    const wallet = walletDatabase.get(walletId);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Update wallet
    const updatedWallet = {
      ...wallet,
      ...updates,
      updateDate: new Date().toISOString(),
    };

    walletDatabase.set(walletId, updatedWallet);

    // TODO: In production, call Circle API to update wallet

    return NextResponse.json({
      success: true,
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error('Circle wallet update error:', error);
    return NextResponse.json(
      { error: 'Wallet update failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/circle/wallet
 * Delete/disable a wallet
 *
 * Body: { walletId: string }
 * Returns: { success: boolean }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { walletId } = await request.json();

    if (!walletId) {
      return NextResponse.json(
        { error: 'walletId is required' },
        { status: 400 }
      );
    }

    const wallet = walletDatabase.get(walletId);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Soft delete - mark as disabled
    wallet.status = 'DISABLED';
    wallet.updateDate = new Date().toISOString();
    walletDatabase.set(walletId, wallet);

    // TODO: In production, call Circle API to disable wallet

    console.log(`⚠️  Disabled Circle wallet: ${wallet.address}`);

    return NextResponse.json({
      success: true,
      message: 'Wallet disabled successfully',
    });
  } catch (error) {
    console.error('Circle wallet deletion error:', error);
    return NextResponse.json(
      { error: 'Wallet deletion failed' },
      { status: 500 }
    );
  }
}
