// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC8004Identity
 * @notice TypeScript-mirrorable interface for the Identity portion of
 *         ERC-8004 (DRAFT). The DRAFT spec describes per-chain Identity,
 *         Reputation, and narrow Validation registries; this interface
 *         covers Identity only. Reputation + Validation interfaces ship
 *         in later weeks.
 *
 * @dev    ARC implements this through an adapter (`ArcIdentityAdapter`)
 *         so the spec can shift without forcing a Passport-state
 *         migration. The high-level `ArcPassport` holds the adapter
 *         address and routes through this interface. Swapping the
 *         adapter == `setIdentityAdapter(newAddr)` with no Passport
 *         state migration. Do **not** market downstream products as
 *         "ERC-8004 compliant" — the spec is DRAFT and field names may
 *         still change; we publish a public compatibility matrix
 *         instead.
 *
 *         Field shapes here are deliberately conservative:
 *           - identity = (id, subject, metadataURI, revoked)
 *           - revocation does not delete history; it sets a flag so
 *             downstream services can render a revoked badge.
 *           - subject -> id is unique. A subject can only hold ONE
 *             active identity at a time. To "rotate," revoke the old
 *             one and register a new one.
 *         These match the W8 plan exactly: no oracles, no TEE, no
 *         multi-validator semantics in this interface.
 */
interface IERC8004Identity {
    /// @notice Emitted when a new identity is registered.
    event IdentityRegistered(
        uint256 indexed id,
        address indexed subject,
        string metadataURI
    );

    /// @notice Emitted when the metadata URI of an identity is updated.
    event IdentityMetadataUpdated(uint256 indexed id, string metadataURI);

    /// @notice Emitted when an identity is revoked.
    event IdentityRevoked(uint256 indexed id);

    /**
     * @notice Register a new identity for `subject` pointing at
     *         off-chain metadata at `metadataURI`. Returns the new
     *         identity id. Reverts if `subject` already has an active
     *         (non-revoked) identity.
     */
    function register(address subject, string calldata metadataURI)
        external
        returns (uint256 id);

    /**
     * @notice Update the metadata URI of identity `id`. Caller must be
     *         authorized per the implementation's access control
     *         (typically the subject or an admin).
     */
    function updateMetadata(uint256 id, string calldata metadataURI) external;

    /**
     * @notice Mark identity `id` as revoked. Idempotent. Does not
     *         clear the underlying record so historic resolution still
     *         renders the revoked state.
     */
    function revoke(uint256 id) external;

    /**
     * @notice Read identity `id`. Returns the zero address as
     *         `subject` if `id` does not exist.
     */
    function getIdentity(uint256 id)
        external
        view
        returns (address subject, string memory metadataURI, bool revoked);

    /**
     * @notice Resolve the active identity id for `subject`. Returns 0
     *         if the subject has no identity, or if their identity has
     *         been revoked (revocation clears the reverse index).
     */
    function resolveBySubject(address subject)
        external
        view
        returns (uint256 id);
}
