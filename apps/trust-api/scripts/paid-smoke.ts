/**
 * Live-facilitator paid round-trip for the $0.01 trust read.
 *
 * THIS SCRIPT MOVES REAL USDC ON BASE MAINNET. It is the W4 acceptance gate.
 *
 * Requires:
 *   - viem installed (handled by `npm install` from repo root)
 *   - ARC_TEST_PRIVATE_KEY  — 0x-prefixed private key with USDC + ETH on Base
 *   - ARC_PAYTO             — recipient address (your wallet)
 *   - ARC_TRUST_API_URL     — defaults to http://127.0.0.1:3030
 *   - RUN_LIVE=1            — explicit opt-in. Without this, the script
 *                             exits 0 with a notice (so CI can keep it
 *                             wired without auto-spending).
 *
 * Flow:
 *   1. Boot trust-api against the public x402 facilitator (default).
 *   2. POST /v1/trust/read with no X-PAYMENT → expect 402 quote.
 *   3. Sign EIP-3009 transferWithAuthorization for USDC on Base mainnet
 *      using viem's `signTypedData`. Build the X-PAYMENT header.
 *   4. POST /v1/trust/read with X-PAYMENT → expect 200 + scoreV1 +
 *      X-Payment-Response with a real Base mainnet tx hash.
 *
 * Cost per run: $0.01 USDC + gas. Idempotency: each call uses a fresh
 * random nonce so retries do not double-charge against the same auth.
 */

import { spawn } from 'node:child_process';
import {
  ARC_TRUST_TIERS,
  BASE_MAINNET,
  buildEvmExactTypedData,
  buildXPaymentHeader,
  usdToBaseUnits,
  type PaymentRequirement,
} from '@arc/x402-client';

async function main(): Promise<void> {
  if (process.env.RUN_LIVE !== '1') {
    console.log(
      'paid-smoke: RUN_LIVE is not set; skipping live round-trip. ' +
        'Set RUN_LIVE=1, ARC_TEST_PRIVATE_KEY, and ARC_PAYTO to fire.'
    );
    return;
  }

  const pkRaw = mustEnv('ARC_TEST_PRIVATE_KEY');
  const payTo = mustEnv('ARC_PAYTO');
  const url = process.env.ARC_TRUST_API_URL ?? 'http://127.0.0.1:3030';
  const target = process.env.ARC_TEST_TARGET ?? '0x1234567890abcdef1234567890abcdef12345678';

  const { privateKey, account } = await loadViemAccount(pkRaw);
  console.log(`  payer=${account.address} payTo=${payTo} url=${url}`);

  // 1) Quote
  const quote = await fetchJson(`${url}/v1/trust/read`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ target }),
  });
  assertEq(quote.status, 402, 'quote status');
  const requirement = quote.body.accepts?.[0] as PaymentRequirement | undefined;
  if (!requirement) throw new Error('quote: missing requirement');
  assertEq(requirement.scheme, 'exact', 'scheme');
  assertEq(requirement.network, BASE_MAINNET.network, 'network');
  assertEq(requirement.maxAmountRequired, usdToBaseUnits(ARC_TRUST_TIERS.read), 'amount');
  assertEq(requirement.asset.toLowerCase(), BASE_MAINNET.usdcAddress.toLowerCase(), 'asset');
  console.log(`  [quote] 402 ok amount=${requirement.maxAmountRequired}`);

  // 2) Build typed-data, sign, assemble header
  const typedData = buildEvmExactTypedData(requirement, account.address);
  const viem = await import('viem');
  const signature = await account.signTypedData({
    domain: typedData.domain as any,
    types: typedData.types as any,
    primaryType: typedData.primaryType,
    message: typedData.message as any,
  });
  const header = buildXPaymentHeader(requirement.network, typedData.message, signature);
  console.log(`  [sign] header.length=${header.length} sig=${signature.slice(0, 18)}…`);
  voidUse(viem, privateKey);

  // 3) Paid call
  const paid = await fetchRaw(`${url}/v1/trust/read`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-payment': header },
    body: JSON.stringify({ target }),
  });
  if (paid.status !== 200) {
    throw new Error(`paid call status ${paid.status}: ${paid.text.slice(0, 500)}`);
  }
  const body = JSON.parse(paid.text);
  console.log(`  [paid] 200 overallScore=${body.assessment?.overallScore}`);

  const xpr = paid.headers.get('x-payment-response');
  if (!xpr) throw new Error('X-Payment-Response header missing');
  const settled = JSON.parse(Buffer.from(xpr, 'base64').toString('utf8'));
  console.log(
    `  [settle] success=${settled.success} tx=${settled.transaction} network=${settled.network}`
  );
  if (!settled.success) throw new Error(`settlement failed: ${settled.errorReason}`);
  console.log('paid-smoke OK');
}

interface ViemAccount {
  address: string;
  signTypedData(args: any): Promise<`0x${string}`>;
}

async function loadViemAccount(pkRaw: string): Promise<{ privateKey: string; account: ViemAccount }> {
  // Lazy import so the script can be loaded without viem installed
  // (it'll just exit early on the RUN_LIVE check above).
  const { privateKeyToAccount } = await import('viem/accounts');
  const privateKey = pkRaw.startsWith('0x') ? pkRaw : `0x${pkRaw}`;
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  return { privateKey, account: account as unknown as ViemAccount };
}

async function fetchRaw(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  return { status: res.status, text: await res.text(), headers: res.headers };
}

async function fetchJson(url: string, init: RequestInit) {
  const r = await fetchRaw(url, init);
  return { status: r.status, body: r.text ? JSON.parse(r.text) : null };
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing required env ${name}`);
  return v;
}

function assertEq(actual: unknown, expected: unknown, msg: string): void {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function voidUse(..._args: unknown[]): void {
  /* silence unused locals when the script is lint-checked */
}

// Silence unused import warning for spawn — kept for future restart logic.
void spawn;

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
