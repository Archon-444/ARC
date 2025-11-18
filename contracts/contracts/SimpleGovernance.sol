// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SimpleGovernance (STUB for v0.1)
 * @notice Basic skeleton for governance functionality
 * @dev This is a stub contract - functions revert with "Not implemented"
 */
contract SimpleGovernance {
    struct Proposal {
        address proposer;
        string description;
        uint64 startTime;
        uint64 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }

    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event Executed(uint256 indexed proposalId);

    /**
     * @notice Create a new proposal (NOT IMPLEMENTED in v0.1)
     * @param description Proposal description
     */
    function createProposal(string calldata description) external {
        revert("Not implemented");
    }

    /**
     * @notice Vote on a proposal (NOT IMPLEMENTED in v0.1)
     * @param proposalId Proposal ID
     * @param support Whether to support the proposal
     */
    function vote(uint256 proposalId, bool support) external {
        revert("Not implemented");
    }

    /**
     * @notice Execute a proposal (NOT IMPLEMENTED in v0.1)
     * @param proposalId Proposal ID
     */
    function execute(uint256 proposalId) external {
        revert("Not implemented");
    }

    /**
     * @notice Get proposal count
     * @return count Number of proposals
     */
    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }
}
