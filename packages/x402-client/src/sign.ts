/**
 * Builders for the EVM `exact` scheme payment envelope.
 *
 * These are pure data-shape helpers — they do not depend on viem or any
 * other signing library. Consumers sign the produced EIP-712 typed-data
 * using their preferred wallet/signer, then call buildXPaymentHeader to
 * produce the base64 X-PAYMENT header value.
 */

import { X402_VERSION, type PaymentPayload, type PaymentRequirement } from './types';
import { BASE_MAINNET } from './constants';

export interface AuthorizationFields {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface EvmExactTypedData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: {
    TransferWithAuthorization: Array<{ name: string; type: string }>;
  };
  primaryType: 'TransferWithAuthorization';
  message: AuthorizationFields;
}

export interface BuildAuthorizationOptions {
  /** Now in unix seconds (override for deterministic tests). */
  now?: number;
  /** Validity window — defaults to the requirement's maxTimeoutSeconds or 600s. */
  validForSeconds?: number;
  /** 0x-prefixed 32-byte hex nonce. If absent a random one is generated. */
  nonce?: string;
  /** Chain id. Defaults to Base mainnet (8453) when the network is base-mainnet. */
  chainId?: number;
}

/**
 * Build the EIP-712 typed-data envelope for an EIP-3009
 * `transferWithAuthorization` matching a given x402 PaymentRequirement.
 */
export function buildEvmExactTypedData(
  requirement: PaymentRequirement,
  payer: string,
  opts: BuildAuthorizationOptions = {}
): EvmExactTypedData {
  if (requirement.scheme !== 'exact') {
    throw new Error(`buildEvmExactTypedData only supports the "exact" scheme`);
  }
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const window = opts.validForSeconds ?? requirement.maxTimeoutSeconds ?? 600;
  const validAfter = String(now - 5);
  const validBefore = String(now + window);
  const nonce = opts.nonce ?? randomNonce();
  const chainId = opts.chainId ?? defaultChainIdForNetwork(requirement.network);

  const domainName = (requirement.extra?.name as string | undefined) ?? BASE_MAINNET.usdcEip712.name;
  const domainVersion =
    (requirement.extra?.version as string | undefined) ?? BASE_MAINNET.usdcEip712.version;

  return {
    domain: {
      name: domainName,
      version: domainVersion,
      chainId,
      verifyingContract: requirement.asset,
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    message: {
      from: payer,
      to: requirement.payTo,
      value: requirement.maxAmountRequired,
      validAfter,
      validBefore,
      nonce,
    },
  };
}

/**
 * Assemble the base64-encoded X-PAYMENT header value once a signature
 * over the typed-data is available.
 */
export function buildXPaymentHeader(
  network: string,
  authorization: AuthorizationFields,
  signature: string
): string {
  const payload: PaymentPayload = {
    x402Version: X402_VERSION,
    scheme: 'exact',
    network,
    payload: { signature, authorization },
  };
  return base64Encode(JSON.stringify(payload));
}

function base64Encode(s: string): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(s, 'utf8').toString('base64');
  return btoa(unescape(encodeURIComponent(s)));
}

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 32; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let hex = '0x';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

function defaultChainIdForNetwork(network: string): number {
  switch (network) {
    case 'base-mainnet':
      return 8453;
    case 'base-sepolia':
      return 84532;
    default:
      throw new Error(`unknown chain id for network ${network}; pass opts.chainId`);
  }
}
