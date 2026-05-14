/**
 * On-chain passport source for trust-api.
 *
 * When `ARC_PASSPORT_ADDRESS` + `ARC_ATTESTATION_REGISTRY_ADDRESS` +
 * `ARC_RPC_URL` are configured at boot, this module is constructed
 * and the passport route consults it instead of returning the W8
 * placeholder. The shape it returns is:
 *
 *   {
 *     status: 'on_chain' | 'not_indexed',
 *     address: <lowercased subject>,
 *     passport: { passportId, metadataURI, revoked,
 *                 counselAttestation } | null,
 *     attestations: Array<{
 *       schemaName, schemaId, status,
 *       attestations: AttestationRecord[]
 *     }>
 *   }
 *
 * Posture choices:
 *   - Reads only. No writes ever go through trust-api.
 *   - All canonical schemas are walked in parallel; unknown
 *     schemaIds on-chain are silently ignored here (they cannot
 *     resolve since we walk by schemaId, not by attestation id).
 *     The opinionated allowlist from W8-W12.4 is the trust boundary.
 *   - Network errors surface as { status: 'error', reason } rather
 *     than throwing -- the route handler renders them as 502 / 503
 *     instead of bubbling unhandled.
 *   - Currently does NOT fetch IPFS bodies. The body fetch belongs
 *     to the W13.3 /v1/attestations/:subject route where the
 *     consumer explicitly asks for it. The passport response stays
 *     small and cacheable.
 */

import { createPublicClient, http, type Address, type Hex, type PublicClient } from 'viem';

import { ArcPassportClient } from '@arc/passport-sdk';
import { ArcAttestationReader, ARC_TESTNET, type AttestationRecord } from '@arc/attestation-reader';

import {
  CANONICAL_SCHEMA_IDS,
  CANONICAL_SCHEMA_NAMES,
  type CanonicalSchemaName,
} from './attestation-schemas';

export interface PassportSourceOptions {
  passportAddress: Address;
  attestationRegistryAddress: Address;
  rpcUrl: string;
}

export interface PassportRenderedRow {
  schemaName: CanonicalSchemaName;
  schemaId: Hex;
  attestations: SerialisedAttestation[];
}

export interface SerialisedAttestation {
  id: Hex;
  subject: Address;
  schemaId: Hex;
  dataHash: Hex;
  /** Unix seconds; 0 = no expiry. */
  expiry: number;
  /** Unix seconds the record was anchored. */
  createdAt: number;
  signer: Address;
  revoked: boolean;
}

export type PassportSourceResult =
  | {
      status: 'on_chain';
      address: Address;
      passport:
        | {
            passportId: string;
            subject: Address;
            metadataURI: string;
            revoked: boolean;
            counselAttestation: Hex;
          }
        | null;
      attestations: PassportRenderedRow[];
    }
  | {
      status: 'not_indexed';
      address: Address;
      passport: null;
      attestations: [];
      notice: string;
    }
  | {
      status: 'error';
      address: Address;
      reason: string;
    };

export class PassportSource {
  private readonly passport: ArcPassportClient;
  private readonly reader: ArcAttestationReader;

  constructor(opts: PassportSourceOptions) {
    const publicClient = createPublicClient({
      chain: ARC_TESTNET,
      transport: http(opts.rpcUrl),
    }) as PublicClient;

    this.passport = new ArcPassportClient({
      address: opts.passportAddress,
      publicClient,
    });
    this.reader = new ArcAttestationReader({
      address: opts.attestationRegistryAddress,
      publicClient,
    });
  }

  /**
   * Assemble the full passport response for `subject`. Always
   * lowercases the address before reading so cache keys + downstream
   * comparisons stay canonical.
   */
  async getPassportFor(subject: Address): Promise<PassportSourceResult> {
    const address = subject.toLowerCase() as Address;
    try {
      const passport = await this.passport.getPassportBySubject(address);
      if (!passport) {
        return {
          status: 'not_indexed',
          address,
          passport: null,
          attestations: [],
          notice:
            'No on-chain passport recorded for this subject on the configured ArcPassport address.',
        };
      }

      // Walk every canonical schema in parallel. Each schema produces
      // an array of current (non-revoked) attestations; revoked rows
      // are filtered out by the reader. The opinionated allowlist
      // means we never accidentally render an unknown schema as if it
      // were canonical -- the reader is the contract surface, the
      // allowlist is the rendering boundary.
      const rows = await Promise.all(
        CANONICAL_SCHEMA_NAMES.map(async (schemaName) => {
          const schemaId = CANONICAL_SCHEMA_IDS[schemaName];
          const records = await this.reader.listCurrentAttestations(address, schemaId);
          return {
            schemaName,
            schemaId,
            attestations: records.map(serialise),
          } satisfies PassportRenderedRow;
        })
      );

      return {
        status: 'on_chain',
        address,
        passport: {
          passportId: passport.passportId.toString(),
          subject: passport.subject,
          metadataURI: passport.metadataURI,
          revoked: passport.revoked,
          counselAttestation: passport.counselAttestation,
        },
        attestations: rows,
      };
    } catch (err) {
      return {
        status: 'error',
        address,
        reason: `Passport read failed: ${(err as Error).message}`,
      };
    }
  }
}

function serialise(r: AttestationRecord): SerialisedAttestation {
  return {
    id: r.id,
    subject: r.subject,
    schemaId: r.schemaId,
    dataHash: r.dataHash,
    expiry: Number(r.expiry),
    createdAt: Number(r.createdAt),
    signer: r.signer,
    revoked: r.revoked,
  };
}
