/**
 * @arc/passport-sdk — TypeScript client for ArcPassport.
 *
 * Wraps viem's `PublicClient` (reads) and `WalletClient` (writes)
 * around a deployed ArcPassport address. Returns plain JS objects;
 * no class hierarchies, no implicit caching. The trust-api consumes
 * this directly when populating arc_passport_get; agent-side code
 * uses it through the MCP server.
 *
 * Usage:
 *
 *   import { createPublicClient, http } from 'viem';
 *   import { ArcPassportClient, ARC_TESTNET } from '@arc/passport-sdk';
 *
 *   const publicClient = createPublicClient({
 *     chain: ARC_TESTNET,
 *     transport: http(),
 *   });
 *
 *   const passport = new ArcPassportClient({
 *     address: '0x...',                    // ArcPassport deployment
 *     publicClient,
 *   });
 *
 *   const result = await passport.getPassportBySubject('0xabc...');
 *   if (result.passportId === 0n) {
 *     // no passport, or revoked
 *   } else {
 *     console.log(result.metadataURI, result.counselAttestation);
 *   }
 */

import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import { defineChain } from 'viem';
import { ARC_PASSPORT_ABI } from './abi.js';

export { ARC_PASSPORT_ABI } from './abi.js';

/** Arc testnet chain definition. Chain id sourced from contracts/hardhat.config.js. */
export const ARC_TESTNET = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

export interface ArcPassportClientOptions {
  /** Deployed ArcPassport address. */
  address: Address;
  /** viem PublicClient for read calls. Required. */
  publicClient: PublicClient;
  /** viem WalletClient for write calls. Optional — reads-only without it. */
  walletClient?: WalletClient;
}

export interface PassportRecord {
  passportId: bigint;
  subject: Address;
  metadataURI: string;
  revoked: boolean;
  counselAttestation: Hex;
}

/** A `passportId === 0n` result means "no active passport." */
export interface ResolveResult {
  passportId: bigint;
  /** Convenience flag matching `passportId === 0n`. */
  exists: boolean;
}

export class ArcPassportClient {
  private readonly address: Address;
  private readonly publicClient: PublicClient;
  private readonly walletClient?: WalletClient;

  constructor(opts: ArcPassportClientOptions) {
    this.address = opts.address;
    this.publicClient = opts.publicClient;
    this.walletClient = opts.walletClient;
  }

  // ──────────────────────────────────────────────────────────────────
  //  Reads
  // ──────────────────────────────────────────────────────────────────

  /**
   * Read a passport by id. Returns null if the id has never been
   * issued (subject === 0x0). A revoked record still resolves; check
   * the `revoked` flag.
   */
  async getPassport(passportId: bigint): Promise<PassportRecord | null> {
    const [subject, metadataURI, revoked, counselAttestation] = (await this.publicClient.readContract(
      {
        address: this.address,
        abi: ARC_PASSPORT_ABI,
        functionName: 'getPassport',
        args: [passportId],
      }
    )) as [Address, string, boolean, Hex];

    if (subject === '0x0000000000000000000000000000000000000000') return null;

    return { passportId, subject, metadataURI, revoked, counselAttestation };
  }

  /**
   * Resolve the active passport id for a subject. Returns
   * `{ passportId: 0n, exists: false }` if the subject has no
   * active passport (no record or revoked).
   */
  async resolveBySubject(subject: Address): Promise<ResolveResult> {
    const passportId = (await this.publicClient.readContract({
      address: this.address,
      abi: ARC_PASSPORT_ABI,
      functionName: 'resolveBySubject',
      args: [subject],
    })) as bigint;
    return { passportId, exists: passportId !== 0n };
  }

  /**
   * Convenience: resolve the active passport for `subject` and fetch
   * its full record. Returns null if the subject has no active
   * passport. Two RPC calls under the hood.
   */
  async getPassportBySubject(subject: Address): Promise<PassportRecord | null> {
    const { passportId, exists } = await this.resolveBySubject(subject);
    if (!exists) return null;
    return this.getPassport(passportId);
  }

  /** Read the currently configured identity adapter address. */
  async getIdentityAdapter(): Promise<Address> {
    return (await this.publicClient.readContract({
      address: this.address,
      abi: ARC_PASSPORT_ABI,
      functionName: 'identityAdapter',
    })) as Address;
  }

  // ──────────────────────────────────────────────────────────────────
  //  Writes (require walletClient)
  // ──────────────────────────────────────────────────────────────────

  /**
   * Mint a passport for `walletClient.account` pointing at
   * `metadataURI`. Returns the transaction hash; await
   * `publicClient.waitForTransactionReceipt({ hash })` to get the
   * mined receipt, and parse the PassportMinted event to extract the
   * issued passportId.
   */
  async mintSelf(metadataURI: string): Promise<Hex> {
    const wallet = this.requireWallet();
    if (!wallet.account) throw new Error('passport-sdk: walletClient has no account');
    return wallet.writeContract({
      address: this.address,
      abi: ARC_PASSPORT_ABI,
      functionName: 'mintSelf',
      args: [metadataURI],
      account: wallet.account,
      chain: wallet.chain ?? null,
    });
  }

  async updateMetadata(passportId: bigint, metadataURI: string): Promise<Hex> {
    const wallet = this.requireWallet();
    if (!wallet.account) throw new Error('passport-sdk: walletClient has no account');
    return wallet.writeContract({
      address: this.address,
      abi: ARC_PASSPORT_ABI,
      functionName: 'updateMetadata',
      args: [passportId, metadataURI],
      account: wallet.account,
      chain: wallet.chain ?? null,
    });
  }

  async revoke(passportId: bigint): Promise<Hex> {
    const wallet = this.requireWallet();
    if (!wallet.account) throw new Error('passport-sdk: walletClient has no account');
    return wallet.writeContract({
      address: this.address,
      abi: ARC_PASSPORT_ABI,
      functionName: 'revoke',
      args: [passportId],
      account: wallet.account,
      chain: wallet.chain ?? null,
    });
  }

  private requireWallet(): WalletClient {
    if (!this.walletClient) {
      throw new Error('passport-sdk: walletClient required for write calls');
    }
    return this.walletClient;
  }
}
