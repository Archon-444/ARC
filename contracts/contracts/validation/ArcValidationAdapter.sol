// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IERC8004Validation.sol";

/**
 * @title ArcValidationAdapter
 * @notice ARC's W10 narrow Validation hook. Implements
 *         `IERC8004Validation`. Stub-shaped: VALIDATOR_ROLE-gated
 *         single-signer records with off-chain evidence dataHash.
 *
 *         No oracle pull mechanics, no TEE attestation, no
 *         multi-validator consensus, no slashing. Adding any of those
 *         later means deploying a new adapter; the W8 ArcPassport's
 *         `setIdentityAdapter` pattern does not apply here directly
 *         (validations are not held by Passport), but downstream
 *         consumers (trust-api, indexer) can be repointed at a new
 *         adapter address with a config change.
 *
 *         Access control:
 *           - DEFAULT_ADMIN_ROLE: grant/revoke roles; revoke any
 *             validation in emergencies.
 *           - VALIDATOR_ROLE: record + revoke own validations.
 *             Production grants this to vetted validators only.
 */
contract ArcValidationAdapter is IERC8004Validation, AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    struct Validation {
        address subject;
        bytes32 claim;
        address validator;
        bool outcome;
        uint64 expiry;
        uint64 createdAt;
        bytes32 dataHash;
        bool revoked;
    }

    /// @dev per-validator monotonic nonce so id derivation is
    ///      deterministic and free of block-timestamp dependence.
    mapping(address => uint256) private _validatorNonce;

    mapping(bytes32 => Validation) private _validations;

    /// @dev (subject, claim) -> ordered list of validation ids.
    mapping(address => mapping(bytes32 => bytes32[])) private _bySubjectClaim;

    constructor(address admin) {
        require(admin != address(0), "ArcValidationAdapter: admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @inheritdoc IERC8004Validation
    function recordValidation(
        address subject,
        bytes32 claim,
        bool outcome,
        uint64 expiry,
        bytes32 dataHash
    ) external onlyRole(VALIDATOR_ROLE) returns (bytes32 id) {
        require(subject != address(0), "ArcValidationAdapter: subject=0");
        require(claim != bytes32(0), "ArcValidationAdapter: claim=0");
        require(dataHash != bytes32(0), "ArcValidationAdapter: dataHash=0");
        require(
            expiry == 0 || expiry > block.timestamp,
            "ArcValidationAdapter: expiry in past"
        );

        uint256 nonce = _validatorNonce[msg.sender]++;
        id = keccak256(
            abi.encode(subject, claim, msg.sender, outcome, expiry, dataHash, nonce)
        );

        _validations[id] = Validation({
            subject: subject,
            claim: claim,
            validator: msg.sender,
            outcome: outcome,
            expiry: expiry,
            createdAt: uint64(block.timestamp),
            dataHash: dataHash,
            revoked: false
        });
        _bySubjectClaim[subject][claim].push(id);

        emit ValidationRecorded(id, subject, claim, msg.sender, outcome, expiry, dataHash);
    }

    /// @inheritdoc IERC8004Validation
    function revokeValidation(bytes32 id) external {
        Validation storage v = _validations[id];
        require(v.subject != address(0), "ArcValidationAdapter: unknown");
        require(
            msg.sender == v.validator || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "ArcValidationAdapter: not authorized"
        );
        if (v.revoked) return;
        v.revoked = true;
        emit ValidationRevoked(id, msg.sender);
    }

    /// @inheritdoc IERC8004Validation
    function getValidation(bytes32 id)
        external
        view
        returns (
            address subject,
            bytes32 claim,
            address validator,
            bool outcome,
            uint64 expiry,
            uint64 createdAt,
            bytes32 dataHash,
            bool revoked
        )
    {
        Validation storage v = _validations[id];
        return (
            v.subject,
            v.claim,
            v.validator,
            v.outcome,
            v.expiry,
            v.createdAt,
            v.dataHash,
            v.revoked
        );
    }

    /// @inheritdoc IERC8004Validation
    function isValid(bytes32 id) external view returns (bool) {
        Validation storage v = _validations[id];
        if (v.subject == address(0)) return false;
        if (v.revoked) return false;
        if (v.expiry != 0 && v.expiry <= block.timestamp) return false;
        return true;
    }

    /// @notice Number of validations recorded for `(subject, claim)`.
    function validationCount(address subject, bytes32 claim) external view returns (uint256) {
        return _bySubjectClaim[subject][claim].length;
    }

    /// @notice Read the i-th validation id for `(subject, claim)`.
    function validationAt(address subject, bytes32 claim, uint256 index)
        external
        view
        returns (bytes32 id)
    {
        require(
            index < _bySubjectClaim[subject][claim].length,
            "ArcValidationAdapter: index oob"
        );
        return _bySubjectClaim[subject][claim][index];
    }

    /// @notice Next nonce `validator` would use.
    function nextNonce(address validator) external view returns (uint256) {
        return _validatorNonce[validator];
    }
}
