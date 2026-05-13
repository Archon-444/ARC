// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IERC8004Reputation.sol";

/**
 * @title ArcReputationAdapter
 * @notice ARC's W9 single-signer feedback store. Implements
 *         `IERC8004Reputation`. Feedback is append-only: each call to
 *         `postFeedback` records a new immutable entry. There is no
 *         revoke; to "correct" feedback, post a fresh entry with
 *         opposite sentiment. The history stays readable so a signer
 *         cannot selectively rewrite their past statements.
 *
 *         Access control:
 *           - DEFAULT_ADMIN_ROLE: grant/revoke roles, including handing
 *             FEEDBACK_ROLE to additional signers if needed.
 *           - FEEDBACK_ROLE: post feedback. Production deployments
 *             grant this to a small set of editorial / counsel
 *             signers, never to arbitrary EOAs.
 *
 *         Off-chain workflow:
 *           1. Signer constructs a feedback body (free-form JSON or
 *              an EIP-712 typed-data envelope).
 *           2. Computes `dataHash` (keccak256 of canonical body, or
 *              the EIP-712 digest).
 *           3. Stores the body in IPFS/S3.
 *           4. Calls `postFeedback(subject, dataHash, sentiment)`.
 *           5. Consumers fetch the body from IPFS using `dataHash` as
 *              the integrity check.
 *
 *         The W9 plan calls this "single-signer feedback" because
 *         each record has exactly one signer (no aggregation), not
 *         because the contract restricts itself to one global signer.
 *         The role grant is the policy lever.
 */
contract ArcReputationAdapter is IERC8004Reputation, AccessControl {
    bytes32 public constant FEEDBACK_ROLE = keccak256("FEEDBACK_ROLE");

    struct Feedback {
        address subject;
        address signer;
        bytes32 dataHash;
        int16 sentiment;
        uint64 createdAt;
    }

    /// @dev Monotonic nonce per signer so id derivation is deterministic
    ///      and free of block-timestamp dependence.
    mapping(address => uint256) private _signerNonce;

    mapping(bytes32 => Feedback) private _feedback;

    /// @dev Per-subject feedback id index. Append-only.
    mapping(address => bytes32[]) private _bySubject;

    constructor(address admin) {
        require(admin != address(0), "ArcReputationAdapter: admin=0");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @inheritdoc IERC8004Reputation
    function postFeedback(address subject, bytes32 dataHash, int16 sentiment)
        external
        onlyRole(FEEDBACK_ROLE)
        returns (bytes32 id)
    {
        require(subject != address(0), "ArcReputationAdapter: subject=0");
        require(dataHash != bytes32(0), "ArcReputationAdapter: dataHash=0");
        require(
            sentiment >= -100 && sentiment <= 100,
            "ArcReputationAdapter: sentiment out of range"
        );

        uint256 nonce = _signerNonce[msg.sender]++;
        id = keccak256(abi.encode(subject, msg.sender, dataHash, nonce));

        _feedback[id] = Feedback({
            subject: subject,
            signer: msg.sender,
            dataHash: dataHash,
            sentiment: sentiment,
            createdAt: uint64(block.timestamp)
        });
        _bySubject[subject].push(id);

        emit FeedbackPosted(id, subject, msg.sender, sentiment, dataHash);
    }

    /// @inheritdoc IERC8004Reputation
    function getFeedback(bytes32 id)
        external
        view
        returns (
            address subject,
            address signer,
            bytes32 dataHash,
            int16 sentiment,
            uint64 createdAt
        )
    {
        Feedback storage f = _feedback[id];
        return (f.subject, f.signer, f.dataHash, f.sentiment, f.createdAt);
    }

    /// @inheritdoc IERC8004Reputation
    function feedbackCount(address subject) external view returns (uint256) {
        return _bySubject[subject].length;
    }

    /// @inheritdoc IERC8004Reputation
    function feedbackAt(address subject, uint256 index)
        external
        view
        returns (bytes32 id)
    {
        require(index < _bySubject[subject].length, "ArcReputationAdapter: index oob");
        return _bySubject[subject][index];
    }

    /**
     * @notice Read the next nonce that `signer` would use. Useful for
     *         off-chain predict-then-submit flows and for indexers
     *         tracking signer activity.
     */
    function nextNonce(address signer) external view returns (uint256) {
        return _signerNonce[signer];
    }
}
