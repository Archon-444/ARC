import type { WalletClient } from 'viem';

export async function signAction(
  walletClient: WalletClient,
  action: {
    type: string;
    address: string;
    data?: Record<string, unknown>;
  }
) {
  const timestamp = Date.now().toString();
  const nonce =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  let message = `Action: ${action.type}\nAddress: ${action.address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
  if (action.data) {
    message += `\nData: ${JSON.stringify(action.data)}`;
  }

  const signature = await walletClient.signMessage({ message });

  return { signature, timestamp, nonce };
}
