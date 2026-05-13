// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IERC8004Identity.sol";

/**
 * @title ArcPassport
 * @notice ARC's identity primitive. Public-facing wrapper that delegates
 *         all identity storage to an `IERC8004Identity` adapter and
 *         layers on the things ERC-8004 (DRAFT) does not specify:
 *           1. A self-mint path so any subject can claim their own
 *              passport without an admin gating step.
 *           2. An admin-only mint-for-subject path that the migration
 *              helper uses to hydrate passports from `ProfileRegistry`.
 *           3. A counsel-attached attestation hook (`COUNSEL_ROLE`)
 *              that lets a regulated KYB workflow stamp an attestation
 *              id onto a passport without entangling the identity
 *              storage itself.
 *           4. A pluggable adapter (`setIdentityAdapter`) so the
 *              underlying registry can swap when ERC-8004 lands its
 *              final field shape — Passport state does not migrate.
 *
 * @dev    Access control:
 *           - DEFAULT_ADMIN_ROLE: swap the identity adapter, mint a
 *             passport for another subject, revoke any passport.
 *           - COUNSEL_ROLE: attach (and only attach) counsel
 *             attestations. Cannot mint, cannot revoke, cannot swap
 *             the adapter.
 *           - Subject of a passport: update their own metadata; revoke
 *             their own passport.
 *
 *         When this contract is granted REGISTRAR_ROLE on the adapter
 *         (done atomically at deploy time), it becomes the sole writer
 *         to the identity store in production.
 */
contract ArcPassport is AccessControl {
    bytes32 public constant COUNSEL_ROLE = keccak256("COUNSEL_ROLE");

    /// @notice Current identity adapter. Settable by DEFAULT_ADMIN_ROLE.
    IERC8004Identity public identityAdapter;

    /// @notice passportId -> counsel attestation id (the on-chain hash
    ///         of an off-chain EIP-712 typed-data envelope, anchored in
    ///         the W9 AttestationRegistry). Cleared on revoke.
    mapping(uint256 => bytes32) public counselAttestations;

    event IdentityAdapterUpdated(address indexed previous, address indexed next);
    event PassportMinted(uint256 indexed passportId, address indexed subject, string metadataURI);
    event PassportMetadataUpdated(uint256 indexed passportId, string metadataURI);
    event PassportRevoked(uint256 indexed passportId);
    event CounselAttestationAttached(
        uint256 indexed passportId,
        bytes32 attestationId,
        address indexed counsel
    );

    constructor(address admin, IERC8004Identity adapter_) {
        require(admin != address(0), "ArcPassport: admin=0");
        require(address(adapter_) != address(0), "ArcPassport: adapter=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        identityAdapter = adapter_;
        emit IdentityAdapterUpdated(address(0), address(adapter_));
    }

    // ────────────────────────────────────────────────────────────────
    //  Mint
    // ────────────────────────────────────────────────────────────────

    /**
     * @notice Mint a passport for `msg.sender`. Anyone can claim their
     *         own passport. Reverts if the caller already has an active
     *         passport (rotate via `revoke` + `mintSelf`).
     */
    function mintSelf(string calldata metadataURI) external returns (uint256 passportId) {
        passportId = identityAdapter.register(msg.sender, metadataURI);
        emit PassportMinted(passportId, msg.sender, metadataURI);
    }

    /**
     * @notice Admin-only: mint a passport for `subject`. Used by the
     *         W8 migration helper to hydrate passports from
     *         `ProfileRegistry`. Real users should call `mintSelf`.
     */
    function mintFor(address subject, string calldata metadataURI)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint256 passportId)
    {
        passportId = identityAdapter.register(subject, metadataURI);
        emit PassportMinted(passportId, subject, metadataURI);
    }

    // ────────────────────────────────────────────────────────────────
    //  Update / revoke
    // ────────────────────────────────────────────────────────────────

    /**
     * @notice Update the metadata URI of `passportId`. Caller must be
     *         the subject. Reverts if revoked or unknown.
     */
    function updateMetadata(uint256 passportId, string calldata metadataURI) external {
        (address subject, , bool revoked) = identityAdapter.getIdentity(passportId);
        require(subject != address(0), "ArcPassport: unknown");
        require(!revoked, "ArcPassport: revoked");
        require(msg.sender == subject, "ArcPassport: not subject");
        identityAdapter.updateMetadata(passportId, metadataURI);
        emit PassportMetadataUpdated(passportId, metadataURI);
    }

    /**
     * @notice Revoke `passportId`. Caller must be the subject or hold
     *         DEFAULT_ADMIN_ROLE. Clears any attached counsel
     *         attestation so a revoked passport never resolves to a
     *         stale KYB stamp.
     */
    function revoke(uint256 passportId) external {
        (address subject, , bool revoked) = identityAdapter.getIdentity(passportId);
        require(subject != address(0), "ArcPassport: unknown");
        require(
            msg.sender == subject || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "ArcPassport: not authorized"
        );
        if (revoked) return; // Idempotent.
        identityAdapter.revoke(passportId);
        if (counselAttestations[passportId] != bytes32(0)) {
            delete counselAttestations[passportId];
        }
        emit PassportRevoked(passportId);
    }

    // ────────────────────────────────────────────────────────────────
    //  Counsel attestation hook (W9 AttestationRegistry anchor)
    // ────────────────────────────────────────────────────────────────

    /**
     * @notice Attach a counsel attestation id to `passportId`. The id
     *         is the on-chain hash of an off-chain EIP-712 typed-data
     *         envelope (KYB / sanctions / counsel review) anchored in
     *         W9's `AttestationRegistry`. Re-attaching overwrites,
     *         emitting a second event so indexers can render the
     *         history. Cleared automatically on revoke.
     *
     *         Gated to `COUNSEL_ROLE`. Counsel can attach but cannot
     *         mint or revoke — those stay with the subject + admin.
     */
    function attachCounselAttestation(uint256 passportId, bytes32 attestationId)
        external
        onlyRole(COUNSEL_ROLE)
    {
        (address subject, , bool revoked) = identityAdapter.getIdentity(passportId);
        require(subject != address(0), "ArcPassport: unknown");
        require(!revoked, "ArcPassport: revoked");
        require(attestationId != bytes32(0), "ArcPassport: attestationId=0");
        counselAttestations[passportId] = attestationId;
        emit CounselAttestationAttached(passportId, attestationId, msg.sender);
    }

    // ────────────────────────────────────────────────────────────────
    //  Adapter swap
    // ────────────────────────────────────────────────────────────────

    /**
     * @notice Replace the identity adapter. Used when ERC-8004 lands a
     *         field-shape change that requires a new implementation,
     *         or when migrating between adapter versions for any
     *         reason. The Passport contract holds no identity state
     *         itself, so the swap is just a pointer flip — no on-chain
     *         data migration. Off-chain consumers (passport-sdk,
     *         trust-api) must re-index from the new adapter's
     *         IdentityRegistered events.
     *
     *         Counsel attestations are preserved across swaps. They
     *         live in this contract, not the adapter.
     */
    function setIdentityAdapter(IERC8004Identity newAdapter)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(address(newAdapter) != address(0), "ArcPassport: adapter=0");
        address previous = address(identityAdapter);
        identityAdapter = newAdapter;
        emit IdentityAdapterUpdated(previous, address(newAdapter));
    }

    // ────────────────────────────────────────────────────────────────
    //  Read paths
    // ────────────────────────────────────────────────────────────────

    /**
     * @notice Read a passport. Returns:
     *           - subject: 0x0 if unknown.
     *           - metadataURI: empty if unknown.
     *           - revoked: false if unknown, true if revoked.
     *           - counselAttestation: bytes32(0) if none attached.
     */
    function getPassport(uint256 passportId)
        external
        view
        returns (
            address subject,
            string memory metadataURI,
            bool revoked,
            bytes32 counselAttestation
        )
    {
        (subject, metadataURI, revoked) = identityAdapter.getIdentity(passportId);
        counselAttestation = counselAttestations[passportId];
    }

    /**
     * @notice Resolve the active passport id for `subject`. Returns 0
     *         if no active passport (no record or revoked).
     */
    function resolveBySubject(address subject) external view returns (uint256) {
        return identityAdapter.resolveBySubject(subject);
    }
}
