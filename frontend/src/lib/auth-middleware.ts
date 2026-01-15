import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { verifyMessage } from 'viem';
import { kv } from '@vercel/kv';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { listConnectedWallets } from '@/lib/wallet-ownership';

const NONCE_PREFIX = 'nonce';

function buildNonceKey(nonce: string) {
  return `${NONCE_PREFIX}:${nonce}`;
}

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { session };
}

export async function requireWalletOwnership(session: any, address: string) {
  const wallets = (session.user?.connectedWallets as string[]) || [];
  const normalized = address.toLowerCase();
  const ownsWallet = wallets.some((item) => item.toLowerCase() === normalized);

  if (!ownsWallet) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { wallets };
}

export async function requireSignature(
  request: NextRequest,
  expectedAddress: string,
  actionType: string
) {
  const signature = request.headers.get('x-wallet-signature');
  const timestamp = request.headers.get('x-signature-timestamp');
  const nonce = request.headers.get('x-signature-nonce');

  if (!signature || !timestamp || !nonce) {
    return {
      error: NextResponse.json({ error: 'Missing signature headers' }, { status: 400 }),
    };
  }

  const signedAt = Number(timestamp);
  if (!Number.isFinite(signedAt)) {
    return {
      error: NextResponse.json({ error: 'Invalid signature timestamp' }, { status: 400 }),
    };
  }

  const now = Date.now();
  if (Math.abs(now - signedAt) > 60_000) {
    return {
      error: NextResponse.json({ error: 'Signature expired' }, { status: 400 }),
    };
  }

  const nonceKey = buildNonceKey(nonce);
  const nonceUsed = await kv.get(nonceKey);
  if (nonceUsed) {
    return {
      error: NextResponse.json({ error: 'Nonce already used' }, { status: 400 }),
    };
  }

  const message = `Action: ${actionType}\nAddress: ${expectedAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;

  try {
    const recovered = await verifyMessage({
      message,
      signature: signature as `0x${string}`,
    });
    if (recovered.toLowerCase() !== expectedAddress.toLowerCase()) {
      return {
        error: NextResponse.json({ error: 'Invalid signature' }, { status: 403 }),
      };
    }
  } catch {
    return {
      error: NextResponse.json({ error: 'Signature verification failed' }, { status: 400 }),
    };
  }

  await kv.set(nonceKey, '1', { ex: 120 });
  return { signatureVerified: true };
}

export async function requireSessionWallet(request: NextRequest) {
  const sessionResult = await requireSession();
  if (sessionResult.error) {
    return sessionResult;
  }

  const address = request.headers.get('x-wallet-address');
  if (!address) {
    return {
      error: NextResponse.json({ error: 'Missing wallet address' }, { status: 400 }),
    };
  }

  const ownershipResult = await requireWalletOwnership(sessionResult.session, address);
  if (ownershipResult.error) {
    return ownershipResult;
  }

  return { session: sessionResult.session, address };
}
