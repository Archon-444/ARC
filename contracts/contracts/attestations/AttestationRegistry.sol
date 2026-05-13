// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AttestationRegistry
 * @notice W9 anchor for off-chain EIP-712 attestations. The
 *         registry stores only the (subject, schemaId, dataHash,
 *         expiry, signer) tuple on-chain; the typed-data body lives
 *         in IPFS/S3. Consumers fetch the body, recompute the EIP-712
 *         digest, and compare to the on-chain `dataHash` for
 *         tamper-evidence; the body's signature is verified against
 *         the on-chain `signer` field off-chain.
 *
 *         This is the registry that produces the `bytes32 attestationId`
 *         consumed by `ArcPassport.attachCounselAttestation` (W8). The
 *         id is derived deterministically as:
 *
 *             id = keccak256(abi.encode(
 *                 subject, schemaId, dataHash, expiry, signer, nonce
 *             ))
 *
 *         where nonce is per-signer monotonic. Deterministic IDs let
 *         off-chain code predict the id before the tx lands (useful
 *         for "submit attest tx + submit passport.attach tx" flows).
 *
 *         Access control:
 *           - DEFAULT_ADMIN_ROLE: grant/revoke roles; revoke any
 *             attestation in emergencies.
 *           - ATTESTER_ROLE: post attestations. Production grants this
 *             to vetted signers only (counsel, editorial, treasury
 *             auditors). The on-chain check is "the caller holds the
 *             role"; the off-chain signature verification is the
 *             stronger check downstream.
 *
 *         Revocation is supported (unlike reputation feedback). An
 *         attestation can become invalid because the regulated
 *         workflow that produced it was withdrawn, the underlying
 *         counsel review lapsed, or a fraud was discovered. Revoke
 *         flips a flag; it does not delete the record so historic
 *         consumers can render "revoked at block N."
 */
contract AttestationRegistry is AccessControl {
    bytes32 public constant ATTESTER_ROLE = keccak256("ATTESTER_ROLE");

    struct Attestation {
        address subject;
        bytes32 schemaId;
        bytes32 dataHash;
        uint64 expiry;     // unix seconds; 0 = no expiry
        uint64 createdAt;  // block.timestamp at attest time
        address signer;
        bool revoked;
    }

    /// @dev per-signer monotonic nonce so id derivation is deterministic
    ///      and free of block-timestamp dependence.
    mapping(address => uint256) private _signerNonce;

    mapping(bytes32 => Attestation) private _attestations;

    /// @dev (subject, schemaId) -> ordered list of attestation ids.
    ///      The trust-api uses this to fetch every counsel.kyb.v1
    ///      attestation about a subject without scanning logs.
    mapping(address => mapping(bytes32 => bytes32[])) private _bySubjectSchema;

    event Attested(
        bytes32 indexed id,
        address indexed subject,
        bytes32 indexed schemaId,
        bytes32 dataHash,
        uint64 expiry,
        address signer
    );

    event Revoked(bytes32 indexed id, address indexed by);

    constructor(address admin) {
        require(admin != address(0), "AttestationRegistry: admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /**
     * @notice Anchor an attestation on-chain. msg.sender is recorded
     *         as the signer. Caller must hold ATTESTER_ROLE.
     *
     * @param  subject   The address the attestation is about.
     * @param  schemaId  Schema identifier, typically
     *                   keccak256("counsel.kyb.v1") etc. The contract
     *                   does not enforce schema-id format; the
     *                   `arc/attestations` package (W9.3) defines the
     *                   canonical schema ids.
     * @param  dataHash  The EIP-712 digest of the off-chain body
     *                   (DomainSeparator || hashStruct(message)).
     * @param  expiry    Unix seconds; 0 = no expiry.
     * @return id        Deterministic attestation id.
     */
    function attest(
        address subject,
        bytes32 schemaId,
        bytes32 dataHash,
        uint64 expiry
    ) external onlyRole(ATTESTER_ROLE) returns (bytes32 id) {
        require(subject != address(0), "AttestationRegistry: subject=0");
        require(schemaId != bytes32(0), "AttestationRegistry: schemaId=0");
        require(dataHash != bytes32(0), "AttestationRegistry: dataHash=0");
        require(
            expiry == 0 || expiry > block.timestamp,
            "AttestationRegistry: expiry in past"
        );

        uint256 nonce = _signerNonce[msg.sender]++;
        id = keccak256(
            abi.encode(subject, schemaId, dataHash, expiry, msg.sender, nonce)
        );

        _attestations[id] = Attestation({
            subject: subject,
            schemaId: schemaId,
            dataHash: dataHash,
            expiry: expiry,
            createdAt: uint64(block.timestamp),
            signer: msg.sender,
            revoked: false
        });
        _bySubjectSchema[subject][schemaId].push(id);

        emit Attested(id, subject, schemaId, dataHash, expiry, msg.sender);
    }

    /**
     * @notice Revoke an attestation. Caller must be the original
     *         signer or hold DEFAULT_ADMIN_ROLE. Idempotent —
     *         revoking a revoked attestation is a no-op (no event).
     */
    function revoke(bytes32 id) external {
        Attestation storage a = _attestations[id];
        require(a.subject != address(0), "AttestationRegistry: unknown");
        require(
            msg.sender == a.signer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "AttestationRegistry: not authorized"
        );
        if (a.revoked) return;
        a.revoked = true;
        emit Revoked(id, msg.sender);
    }

    /**
     * @notice Read an attestation.
     */
    function getAttestation(bytes32 id)
        external
        view
        returns (Attestation memory)
    {
        return _attestations[id];
    }

    /**
     * @notice Composite "is this attestation usable right now" check.
     *         Returns true only if the record exists, is not revoked,
     *         and (expiry == 0 OR expiry > block.timestamp).
     */
    function isValid(bytes32 id) external view returns (bool) {
        Attestation storage a = _attestations[id];
        if (a.subject == address(0)) return false;
        if (a.revoked) return false;
        if (a.expiry != 0 && a.expiry <= block.timestamp) return false;
        return true;
    }

    /**
     * @notice Number of attestations recorded for `(subject, schemaId)`.
     *         Lets indexers paginate without re-scanning logs.
     */
    function attestationCount(address subject, bytes32 schemaId)
        external
        view
        returns (uint256)
    {
        return _bySubjectSchema[subject][schemaId].length;
    }

    /**
     * @notice Read the i-th attestation id for `(subject, schemaId)`.
     */
    function attestationAt(address subject, bytes32 schemaId, uint256 index)
        external
        view
        returns (bytes32 id)
    {
        require(
            index < _bySubjectSchema[subject][schemaId].length,
            "AttestationRegistry: index oob"
        );
        return _bySubjectSchema[subject][schemaId][index];
    }

    /// @notice Next nonce `signer` would use. Off-chain helpers can
    ///         predict an id pre-tx via this value.
    function nextNonce(address signer) external view returns (uint256) {
        return _signerNonce[signer];
    }
}
