// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC8004Validation
 * @notice TypeScript-mirrorable interface for the Validation portion
 *         of ERC-8004 (DRAFT). Deliberately narrow in W10: each
 *         validation is a single (subject, claim, validator, outcome,
 *         expiry) tuple anchored on-chain, with the off-chain
 *         evidence body addressed by a `dataHash`.
 *
 *         Out of scope (NOT in this interface, per the W10 plan):
 *           - Oracle pull / push mechanics (we do not source claims
 *             from oracles in V0).
 *           - TEE-attested validators (no remote-attestation field).
 *           - Multi-validator aggregation / consensus (one validator
 *             per record; aggregation is an off-chain concern of the
 *             consumer).
 *           - Slashing or stake bonds for validators (no economic
 *             security beyond the validator's reputation).
 *
 *         The "do not market as ERC-8004 compliant" rule from the W8
 *         Identity interface applies here as well — DRAFT spec, we
 *         publish a compatibility matrix instead.
 *
 *         Validations differ from attestations in posture: an
 *         attestation says "I, this signer, claim X about subject Y";
 *         a validation says "validator V has validated claim C about
 *         subject S, and the validation can be revoked or expire."
 *         The distinction matters because validations are often the
 *         output of an automated process (a code audit pipeline, a
 *         CI run, a model checker) whereas attestations are typically
 *         counsel- or editor-signed statements.
 */
interface IERC8004Validation {
    /// @notice Emitted on every successful `recordValidation`. Indexed
    ///         by id + subject + validator so consumers can subscribe.
    event ValidationRecorded(
        bytes32 indexed id,
        address indexed subject,
        bytes32 indexed claim,
        address validator,
        bool outcome,
        uint64 expiry,
        bytes32 dataHash
    );

    /// @notice Emitted when a validation is revoked.
    event ValidationRevoked(bytes32 indexed id, address indexed by);

    /**
     * @notice Record a validation. Caller must be authorized per the
     *         implementation's access control.
     * @param  subject     Address the validation is about.
     * @param  claim       Identifier of what is being validated.
     *                     Typically `keccak256("contract.audit.v1")`,
     *                     `keccak256("policy.compliance.v1")`, etc.
     *                     The contract does not enumerate valid
     *                     claims; consumers conventionally use the
     *                     `arc/attestations` schema id values.
     * @param  outcome     true if the validation passed; false if it
     *                     failed. (Recording failures explicitly is
     *                     useful — "this address failed claim X at
     *                     time T" is information.)
     * @param  expiry      Unix seconds; 0 = no expiry.
     * @param  dataHash    Hash of the off-chain evidence body.
     * @return id          Deterministic id derived from (subject,
     *                     claim, validator, outcome, expiry,
     *                     dataHash, nonce).
     */
    function recordValidation(
        address subject,
        bytes32 claim,
        bool outcome,
        uint64 expiry,
        bytes32 dataHash
    ) external returns (bytes32 id);

    /// @notice Mark a validation as revoked. Idempotent.
    function revokeValidation(bytes32 id) external;

    /// @notice Read a validation record.
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
        );

    /**
     * @notice Composite "is this validation usable right now" check.
     *         True only if the record exists, has not been revoked,
     *         and (expiry == 0 OR expiry > block.timestamp). Does NOT
     *         include `outcome` — a `false` outcome with expiry in
     *         the future is still a valid record; consumers decide
     *         whether to act on a false outcome.
     */
    function isValid(bytes32 id) external view returns (bool);
}
