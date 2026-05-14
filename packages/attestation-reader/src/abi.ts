/**
 * Minimal ABI for the AttestationRegistry read surface. Hand-curated to
 * avoid pulling in Hardhat artifacts as a runtime dep. Regenerate when
 * the contract changes; the contract is in
 * `contracts/contracts/attestations/AttestationRegistry.sol`.
 *
 * If you want to regenerate from artifacts after a Hardhat compile:
 *   jq '.abi' contracts/artifacts/contracts/attestations/AttestationRegistry.sol/AttestationRegistry.json
 *
 * READ-ONLY by design. The package's purpose is to let trust-api +
 * indexers consume on-chain state; production attestation creation
 * goes through `@arc/attestations` (sign + validate) + the operator's
 * signer wallet directly against the contract -- not through this
 * package.
 */

export const ATTESTATION_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'getAttestation',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'subject', type: 'address' },
          { name: 'schemaId', type: 'bytes32' },
          { name: 'dataHash', type: 'bytes32' },
          { name: 'expiry', type: 'uint64' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'signer', type: 'address' },
          { name: 'revoked', type: 'bool' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'isValid',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'attestationCount',
    stateMutability: 'view',
    inputs: [
      { name: 'subject', type: 'address' },
      { name: 'schemaId', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'attestationAt',
    stateMutability: 'view',
    inputs: [
      { name: 'subject', type: 'address' },
      { name: 'schemaId', type: 'bytes32' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: 'id', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'nextNonce',
    stateMutability: 'view',
    inputs: [{ name: 'signer', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Events that downstream indexers subscribe to. Listed here so
  // consumers can compute the topic hashes off this canonical shape.
  {
    type: 'event',
    name: 'Attested',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'subject', type: 'address', indexed: true },
      { name: 'schemaId', type: 'bytes32', indexed: true },
      { name: 'dataHash', type: 'bytes32', indexed: false },
      { name: 'expiry', type: 'uint64', indexed: false },
      { name: 'signer', type: 'address', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Revoked',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'by', type: 'address', indexed: true },
    ],
  },
] as const;
