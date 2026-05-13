// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC8004Reputation
 * @notice TypeScript-mirrorable interface for the Reputation portion of
 *         ERC-8004 (DRAFT). Single-signer feedback only — each feedback
 *         record has exactly one signer. Multi-validator aggregation
 *         (consensus, oracles, TEE-attested validators) is explicitly
 *         out of scope for W9 and would belong to the W10 Validation
 *         hook if it ever ships.
 *
 * @dev    The reputation surface is intentionally tiny:
 *           - A signer authorized via the implementation's access
 *             control posts feedback about a subject.
 *           - Feedback carries an off-chain body hash plus an on-chain
 *             sentiment score so consumers can aggregate without
 *             fetching every body.
 *           - Feedback is append-only. To "retract," post a fresh
 *             feedback with opposite sentiment; the historical record
 *             survives. (No revoke for reputation — revoking history
 *             would let signers selectively rewrite the past.)
 *         The same "do not market as ERC-8004 compliant" rule from
 *         W8's Identity interface applies here. We publish a public
 *         compatibility matrix instead.
 */
interface IERC8004Reputation {
    /// @notice Sentiment band: -100 (worst) .. 100 (best). 0 = neutral.
    ///         Off-chain consumers can map this to any UI; on-chain we
    ///         just bound it so aggregation does not require fetching
    ///         the body.
    /// @dev    int16 lets us encode -100..100 cleanly while leaving
    ///         headroom for callers that might want fractional scaling
    ///         later without an interface change.

    /// @notice Emitted on every `postFeedback` call. Indexed by id +
    ///         subject + signer so consumers can subscribe efficiently.
    event FeedbackPosted(
        bytes32 indexed id,
        address indexed subject,
        address indexed signer,
        int16 sentiment,
        bytes32 dataHash
    );

    /**
     * @notice Post feedback about `subject`. Caller must hold whatever
     *         role the implementation gates this on.
     * @param  subject     The address being reviewed.
     * @param  dataHash    Hash of the off-chain feedback body (e.g.
     *                     keccak256 of canonical JSON, or an EIP-712
     *                     digest if the body is signed typed data).
     * @param  sentiment   Sentiment band in [-100, 100].
     * @return id          Deterministic id derived from
     *                     (subject, signer, dataHash, nonce).
     */
    function postFeedback(address subject, bytes32 dataHash, int16 sentiment)
        external
        returns (bytes32 id);

    /**
     * @notice Read a feedback record.
     * @return subject     Address the feedback is about.
     * @return signer      Address that posted it.
     * @return dataHash    Off-chain body hash.
     * @return sentiment   Score in [-100, 100].
     * @return createdAt   Block timestamp at posting time.
     */
    function getFeedback(bytes32 id)
        external
        view
        returns (
            address subject,
            address signer,
            bytes32 dataHash,
            int16 sentiment,
            uint64 createdAt
        );

    /**
     * @notice The number of feedback records posted about `subject`.
     *         Useful for pagination when building UIs. Does NOT
     *         compute an average — consumers do that off-chain so the
     *         weighting can evolve without a contract migration.
     */
    function feedbackCount(address subject) external view returns (uint256);

    /**
     * @notice Read the i-th feedback id about `subject`. Together with
     *         `feedbackCount`, this gives O(n) per-subject pagination
     *         without forcing the contract to materialize arrays in
     *         memory.
     */
    function feedbackAt(address subject, uint256 index)
        external
        view
        returns (bytes32 id);
}
