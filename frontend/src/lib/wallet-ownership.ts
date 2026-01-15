import { kv } from '@vercel/kv';

const WALLET_PREFIX = 'user:wallets';

function buildKey(userId: string) {
  return `${WALLET_PREFIX}:${userId}`;
}

export async function listConnectedWallets(userId: string): Promise<string[]> {
  const data = await kv.get<string>(buildKey(userId));
  if (!data) return [];
  try {
    const parsed = JSON.parse(data) as string[];
    return parsed.map((address) => address.toLowerCase());
  } catch {
    return [];
  }
}

export async function addConnectedWallet(userId: string, address: string) {
  const current = await listConnectedWallets(userId);
  const normalized = address.toLowerCase();
  if (current.includes(normalized)) {
    return;
  }
  const next = [...current, normalized];
  await kv.set(buildKey(userId), JSON.stringify(next));
}

export async function removeConnectedWallet(userId: string, address: string) {
  const current = await listConnectedWallets(userId);
  const normalized = address.toLowerCase();
  const next = current.filter((item) => item !== normalized);
  await kv.set(buildKey(userId), JSON.stringify(next));
}
