/**
 * GET /v1/attestations/:subject?schema=<name>
 *
 * Free, read-only route. Returns the list of current (non-revoked)
 * attestations for `subject`, optionally filtered to a single
 * canonical schema via the `?schema=` query param.
 *
 * Posture:
 *   - On-chain only. Reads via @arc/attestation-reader.
 *     IPFS-body dereferencing is documented as a follow-up; the
 *     route surfaces the on-chain row (subject, schemaId, dataHash,
 *     expiry, createdAt, signer, revoked) and the consumer fetches
 *     the body itself when it wants to verify against dataHash.
 *   - Unknown schemaIds never appear (we walk by canonical schemaId).
 *   - When ARC_PASSPORT_ADDRESS / ARC_ATTESTATION_REGISTRY_ADDRESS /
 *     ARC_RPC_URL are unset, returns 503 with a structured
 *     `unconfigured` body. The W8 placeholder pattern stays:
 *     CI + unfunded deployments do not fail with cryptic errors.
 *
 * Response shape (200, on_chain):
 *
 *   {
 *     status: 'on_chain',
 *     subject: '0x...',
 *     filter: { schema: <name | null> },
 *     rows: [
 *       {
 *         schemaName,
 *         schemaId,
 *         attestations: SerialisedAttestation[]
 *       },
 *       ...
 *     ]
 *   }
 *
 * Response shape (503, unconfigured):
 *
 *   {
 *     status: 'unconfigured',
 *     reason: '...names the env vars...'
 *   }
 *
 * Response shape (400, bad request):
 *
 *   { error: 'Invalid subject address' }
 *   { error: 'Unknown schema name: <name>' }
 *
 * Response shape (502, upstream error):
 *
 *   { status: 'error', reason: '...RPC failure detail...' }
 */

import type { Request, Response, RequestHandler } from 'express';
import { createPublicClient, http, type Address, type PublicClient } from 'viem';

import { ArcAttestationReader, ARC_TESTNET } from '@arc/attestation-reader';

import type { TrustApiConfig } from '../config';
import {
  CANONICAL_SCHEMA_IDS,
  CANONICAL_SCHEMA_NAMES,
  type CanonicalSchemaName,
} from '../sources/attestation-schemas';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

interface AttestationsSource {
  reader: ArcAttestationReader;
}

function buildSource(cfg: TrustApiConfig): AttestationsSource | null {
  if (!cfg.attestationRegistryAddress || !cfg.rpcUrl) return null;
  if (!ADDRESS_RE.test(cfg.attestationRegistryAddress)) {
    console.warn(
      '[trust-api] ARC_ATTESTATION_REGISTRY_ADDRESS is set but not a valid 0x address; /v1/attestations returns 503.'
    );
    return null;
  }
  const publicClient = createPublicClient({
    chain: ARC_TESTNET,
    transport: http(cfg.rpcUrl),
  }) as PublicClient;
  return {
    reader: new ArcAttestationReader({
      address: cfg.attestationRegistryAddress as Address,
      publicClient,
    }),
  };
}

export function makeAttestationsHandler(cfg: TrustApiConfig): RequestHandler {
  const source = buildSource(cfg);

  return async (req: Request, res: Response) => {
    const subjectRaw = req.params.subject ?? '';
    if (!ADDRESS_RE.test(subjectRaw)) {
      res.status(400).json({ error: 'Invalid subject address' });
      return;
    }
    const subject = subjectRaw.toLowerCase() as Address;

    const schemaParam = req.query.schema;
    let schemaFilter: CanonicalSchemaName | null = null;
    if (typeof schemaParam === 'string' && schemaParam.length > 0) {
      if (!(CANONICAL_SCHEMA_NAMES as readonly string[]).includes(schemaParam)) {
        res.status(400).json({
          error: `Unknown schema name: ${schemaParam}`,
          known: CANONICAL_SCHEMA_NAMES,
        });
        return;
      }
      schemaFilter = schemaParam as CanonicalSchemaName;
    }

    if (!source) {
      res.status(503).json({
        status: 'unconfigured',
        reason:
          'AttestationRegistry read path is not configured on this deployment. Set ARC_ATTESTATION_REGISTRY_ADDRESS + ARC_RPC_URL on the trust-api host to enable.',
      });
      return;
    }

    const schemasToWalk: CanonicalSchemaName[] = schemaFilter
      ? [schemaFilter]
      : [...CANONICAL_SCHEMA_NAMES];

    try {
      const rows = await Promise.all(
        schemasToWalk.map(async (schemaName) => {
          const schemaId = CANONICAL_SCHEMA_IDS[schemaName];
          const records = await source.reader.listCurrentAttestations(subject, schemaId);
          return {
            schemaName,
            schemaId,
            attestations: records.map((r) => ({
              id: r.id,
              subject: r.subject,
              schemaId: r.schemaId,
              dataHash: r.dataHash,
              expiry: Number(r.expiry),
              createdAt: Number(r.createdAt),
              signer: r.signer,
              revoked: r.revoked,
            })),
          };
        })
      );

      res.status(200).json({
        status: 'on_chain',
        subject,
        filter: { schema: schemaFilter },
        rows,
      });
    } catch (err) {
      res.status(502).json({
        status: 'error',
        subject,
        reason: `AttestationRegistry read failed: ${(err as Error).message}`,
      });
    }
  };
}
