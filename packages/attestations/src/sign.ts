import {
  hashTypedData,
  type Address,
  type Hex,
  type LocalAccount,
} from 'viem';
import type { AttestationSchema, AttestationDomain } from './types.js';
import {
  AttestationValidationError,
  type ValidationResult,
} from './validate.js';

/**
 * Inputs to sign an attestation off-chain.
 *
 * `signer` is a viem `LocalAccount` (typically from
 * `privateKeyToAccount(...)`). Callers who want to sign through a
 * WalletClient should call `walletClient.signTypedData({ ... })`
 * directly with `computeTypedData(schema, domain, body)` and then
 * build a `SignedAttestation` themselves — this helper is opinionated
 * around the LocalAccount path because that is what the trust-api
 * uses server-side. Browser flows that use a Wallet RPC go through
 * `computeTypedData` + their own signing call.
 *
 * `validator` is optional. When set, the body is validated before
 * any cryptographic operation; on failure, `signAttestation` throws
 * `AttestationValidationError` carrying the structured `issues[]`
 * array so the caller can render a precise error. Production signing
 * paths (trust-api, the demo-mena composer) MUST pass a validator —
 * a missing range check turns the schemas' "verifiable signature"
 * guarantee into "verifiable signature over nonsense."
 */
export interface SignAttestationInput<TBody> {
  schema: AttestationSchema<TBody>;
  domain: AttestationDomain;
  body: TBody;
  signer: LocalAccount;
  validator?: (body: TBody) => ValidationResult<TBody>;
}

/**
 * Output of `signAttestation`.
 *
 * `dataHash` is what gets anchored on-chain via
 * `AttestationRegistry.attest(..., dataHash, ...)` — it is the EIP-712
 * digest (`hashTypedData(domain, types, primaryType, message)`), NOT
 * the keccak256 of the body. EIP-712 digests include the domain
 * separator so consumers verifying the signature recover the signer
 * correctly even across domain changes.
 *
 * `signature` is the off-chain signature over `dataHash`. The
 * registry does NOT verify this on-chain (single-signer trust model
 * gated by ATTESTER_ROLE); downstream consumers fetching the body
 * MUST verify it against the on-chain `signer` field — that is the
 * stronger cryptographic check.
 */
export interface SignedAttestation<TBody> {
  schemaId: Hex;
  primaryType: string;
  body: TBody;
  dataHash: Hex;
  signature: Hex;
  /** Address whose key produced the signature. */
  signer: Address;
}

/**
 * Lower-level helper that returns just the typed-data object viem
 * understands. Use this when you want to sign with a WalletClient or
 * any other signing path that takes a viem typed-data envelope.
 */
export function computeTypedData<TBody>(
  schema: AttestationSchema<TBody>,
  domain: AttestationDomain,
  body: TBody
): {
  domain: AttestationDomain;
  types: AttestationSchema<TBody>['types'];
  primaryType: string;
  message: TBody;
} {
  return {
    domain,
    types: schema.types,
    primaryType: schema.name,
    message: body,
  };
}

export async function signAttestation<TBody>(
  input: SignAttestationInput<TBody>
): Promise<SignedAttestation<TBody>> {
  const { schema, domain, body, signer, validator } = input;

  if (validator) {
    const result = validator(body);
    if (!result.ok) {
      throw new AttestationValidationError(schema.name, result.issues);
    }
  }

  const typedData = computeTypedData(schema, domain, body);

  // Re-cast across viem's strict typed-data domain types — runtime
  // values are correct, the structural types just disagree on the
  // address-literal flavor of `verifyingContract`.
  const viemTypedData = {
    domain: typedData.domain as unknown as Parameters<typeof hashTypedData>[0]['domain'],
    types: typedData.types,
    primaryType: typedData.primaryType,
    message: typedData.message as unknown as Record<string, unknown>,
  };

  const dataHash = hashTypedData(viemTypedData);
  const signature = await signer.signTypedData(viemTypedData);

  return {
    schemaId: schema.id,
    primaryType: schema.name,
    body,
    dataHash,
    signature,
    signer: signer.address,
  };
}
