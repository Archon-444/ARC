// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IERC8004Identity.sol";

/**
 * @title ArcIdentityAdapter
 * @notice ARC's W8 implementation of `IERC8004Identity`. Standalone
 *         identity store. The `ArcPassport` contract holds a pointer
 *         to this adapter and routes all identity calls through the
 *         `IERC8004Identity` interface, so the implementation can be
 *         swapped without migrating Passport state.
 *
 *         Access control:
 *           - DEFAULT_ADMIN_ROLE: grant/revoke roles, including swapping
 *             which contract holds REGISTRAR_ROLE during an adapter
 *             cutover.
 *           - REGISTRAR_ROLE: register / updateMetadata / revoke. In
 *             production the only holder is the deployed `ArcPassport`
 *             contract; granting it directly to an EOA is an admin
 *             escape hatch for hot fixes.
 *
 *         What this adapter does NOT do (intentional W8 narrowing):
 *           - No transfers. Identity is soulbound by design.
 *           - No multi-active-identity-per-subject. A subject has 0 or
 *             1 active identity; rotation = revoke + register.
 *           - No on-chain validation, attestations, or oracle hooks.
 *             Those layers ship in W9-W10 on top of this primitive.
 */
contract ArcIdentityAdapter is IERC8004Identity, AccessControl {
    /// @notice Roles allowed to mutate the identity store.
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct Identity {
        address subject;
        string metadataURI;
        bool revoked;
    }

    /// @dev `0` is reserved as "no identity"; the first issued id is 1.
    uint256 private _nextId;

    mapping(uint256 => Identity) private _identities;

    /// @dev Reverse lookup. Set on register; cleared on revoke so
    ///      revoked subjects do not silently keep their reverse index.
    mapping(address => uint256) private _subjectToId;

    constructor(address admin) {
        require(admin != address(0), "ArcIdentityAdapter: admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _nextId = 1;
    }

    // ────────────────────────────────────────────────────────────────
    //  IERC8004Identity
    // ────────────────────────────────────────────────────────────────

    /// @inheritdoc IERC8004Identity
    function register(address subject, string calldata metadataURI)
        external
        onlyRole(REGISTRAR_ROLE)
        returns (uint256 id)
    {
        require(subject != address(0), "ArcIdentityAdapter: subject=0");
        require(bytes(metadataURI).length > 0, "ArcIdentityAdapter: empty uri");
        require(_subjectToId[subject] == 0, "ArcIdentityAdapter: already registered");

        id = _nextId++;
        _identities[id] = Identity({
            subject: subject,
            metadataURI: metadataURI,
            revoked: false
        });
        _subjectToId[subject] = id;

        emit IdentityRegistered(id, subject, metadataURI);
    }

    /// @inheritdoc IERC8004Identity
    function updateMetadata(uint256 id, string calldata metadataURI)
        external
        onlyRole(REGISTRAR_ROLE)
    {
        Identity storage idn = _identities[id];
        require(idn.subject != address(0), "ArcIdentityAdapter: unknown id");
        require(!idn.revoked, "ArcIdentityAdapter: revoked");
        require(bytes(metadataURI).length > 0, "ArcIdentityAdapter: empty uri");

        idn.metadataURI = metadataURI;
        emit IdentityMetadataUpdated(id, metadataURI);
    }

    /// @inheritdoc IERC8004Identity
    function revoke(uint256 id) external onlyRole(REGISTRAR_ROLE) {
        Identity storage idn = _identities[id];
        require(idn.subject != address(0), "ArcIdentityAdapter: unknown id");
        if (idn.revoked) {
            // Idempotent: revoking a revoked identity is a no-op rather
            // than a revert, so admins can replay safely.
            return;
        }
        idn.revoked = true;
        // Clear reverse index so resolveBySubject returns 0 immediately.
        // The Identity struct itself is preserved for historic reads.
        delete _subjectToId[idn.subject];
        emit IdentityRevoked(id);
    }

    /// @inheritdoc IERC8004Identity
    function getIdentity(uint256 id)
        external
        view
        returns (address subject, string memory metadataURI, bool revoked)
    {
        Identity storage idn = _identities[id];
        return (idn.subject, idn.metadataURI, idn.revoked);
    }

    /// @inheritdoc IERC8004Identity
    function resolveBySubject(address subject)
        external
        view
        returns (uint256 id)
    {
        return _subjectToId[subject];
    }

    /**
     * @notice Read the next-to-be-issued identity id. Useful for the
     *         passport-sdk's batch-mint flow (mint then read the id),
     *         and for off-chain indexers that want to track issuance
     *         monotonicity.
     */
    function nextId() external view returns (uint256) {
        return _nextId;
    }
}
