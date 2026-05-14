import { NextRequest, NextResponse } from 'next/server';
import { addConnectedWallet } from '@/lib/wallet-ownership';
import { requireSession, requireSignature } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  const sessionResult = await requireSession();
  if (sessionResult.error) {
    return sessionResult.error;
  }

  const { address } = await request.json();
  if (!address) {
    return NextResponse.json({ error: 'address is required' }, { status: 400 });
  }

  const signatureResult = await requireSignature(request, address, 'CONNECT_WALLET');
  if (signatureResult.error) {
    return signatureResult.error;
  }

  const userId = (sessionResult.session.user as any)?.userId;
  if (!userId) {
    return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
  }

  await addConnectedWallet(userId, address);

  return NextResponse.json({ success: true });
}
