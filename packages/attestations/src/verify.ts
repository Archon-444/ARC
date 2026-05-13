import {
  hashTypedData,
  recoverTypedDataAddress,
  type Address,
  type Hex,
} from 'viem';
import type { AttestationSchema, AttestationDomain } from './types.js';

/**
 * Inputs to verify a signed attestation off-chain.
 */
export interface VerifyAttestationInput<TBody> {
  schema: AttestationSchema<TBody>;
  domain: AttestationDomain;
  body: TBody;
  /** The signature produced at sign time. */
  signature: Hex;
  /**
   * The address the consumer expects to have signed (typically read
   * from `AttestationRegistry.getAttestation(id).signer`). The
   * verifier returns ok=true only if the recovered address matches.
   */
  expectedSigner: Address;
}

export interface VerifyAttestationResult {
  ok: boolean;
  /** Recomputed EIP-712 digest. Should match the on-chain dataHash. */
  dataHash: Hex;
  /** Address recovered from the signature. */
  recoveredSigner: Hex;
  /**
   * Set when `ok` is false. One of:
   *   - 'signer-mismatch': signature recovered but != expectedSigner.
   *   - 'recover-failed':  signature could not be recovered at all.
   */
  reason?: 'signer-mismatch' | 'recover-failed';
}

/**
 * Re-hash the body with the schema's typed-data definition, recover
 * the signer from the signature, and assert it matches the expected
 * address. This is the cryptographic check the trust-api should run
 * after pulling an attestation row from `AttestationRegistry` —
 * Hash-of-Hash is the rule: trust the contract for who/when/what,
 * trust the signature for the body integrity.
 *
 * Consumers should ALSO check `dataHash === onchain.dataHash` to
 * catch a body that has been swapped in IPFS since the attestation
 * was anchored. This function returns the recomputed dataHash so the
 * caller can do the equality check at the call site.
 */
export async function verifyAttestation<TBody>(
  input: VerifyAttestationInput<TBody>
): Promise<VerifyAttestationResult> {
  const { schema, domain, body, signature, expectedSigner } = input;

  const typedData = {
    domain: domain as unknown as Parameters<typeof hashTypedData>[0]['domain'],
    types: schema.types,
    primaryType: schema.name,
    message: body as unknown as Record<string, unknown>,
  };

  const dataHash = hashTypedData(typedData);

  let recoveredSigner: Hex;
  try {
    recoveredSigner = await recoverTypedDataAddress({
      ...typedData,
      signature,
    });
  } catch {
    return {
      ok: false,
      dataHash,
      recoveredSigner: '0x' as Hex,
      reason: 'recover-failed',
    };
  }

  if (recoveredSigner.toLowerCase() !== expectedSigner.toLowerCase()) {
    return {
      ok: false,
      dataHash,
      recoveredSigner,
      reason: 'signer-mismatch',
    };
  }

  return { ok: true, dataHash, recoveredSigner };
}
