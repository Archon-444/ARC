/**
 * Minimal ABI for the ArcPassport public surface. Hand-curated to
 * avoid pulling in Hardhat artifacts as a runtime dep. Regenerate
 * (or hand-update) when the contract changes; the contract is in
 * `contracts/contracts/passport/ArcPassport.sol`.
 *
 * If you want to regenerate from artifacts after a Hardhat compile:
 *   jq '.abi' contracts/artifacts/contracts/passport/ArcPassport.sol/ArcPassport.json
 */

export const ARC_PASSPORT_ABI = [
  // Reads
  {
    type: 'function',
    name: 'getPassport',
    stateMutability: 'view',
    inputs: [{ name: 'passportId', type: 'uint256' }],
    outputs: [
      { name: 'subject', type: 'address' },
      { name: 'metadataURI', type: 'string' },
      { name: 'revoked', type: 'bool' },
      { name: 'counselAttestation', type: 'bytes32' },
    ],
  },
  {
    type: 'function',
    name: 'resolveBySubject',
    stateMutability: 'view',
    inputs: [{ name: 'subject', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'identityAdapter',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'counselAttestations',
    stateMutability: 'view',
    inputs: [{ name: 'passportId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  // Writes
  {
    type: 'function',
    name: 'mintSelf',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'metadataURI', type: 'string' }],
    outputs: [{ name: 'passportId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'updateMetadata',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'passportId', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'revoke',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'passportId', type: 'uint256' }],
    outputs: [],
  },
  // Events (used by indexers and the trust-api passport lookup)
  {
    type: 'event',
    name: 'PassportMinted',
    inputs: [
      { name: 'passportId', type: 'uint256', indexed: true },
      { name: 'subject', type: 'address', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PassportMetadataUpdated',
    inputs: [
      { name: 'passportId', type: 'uint256', indexed: true },
      { name: 'metadataURI', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PassportRevoked',
    inputs: [{ name: 'passportId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event',
    name: 'CounselAttestationAttached',
    inputs: [
      { name: 'passportId', type: 'uint256', indexed: true },
      { name: 'attestationId', type: 'bytes32', indexed: false },
      { name: 'counsel', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'IdentityAdapterUpdated',
    inputs: [
      { name: 'previous', type: 'address', indexed: true },
      { name: 'next', type: 'address', indexed: true },
    ],
  },
] as const;
