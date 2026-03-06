// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

/**
 * @title ArcGovernance
 * @dev Enhanced governance contract with production-ready quorum percentages
 * @notice Implements secure voting with 10% quorum requirement for proposal passage
 */
contract ArcGovernance is 
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    // Minimum quorum: 10% of total voting power (production standard)
    uint256 private constant PRODUCTION_QUORUM_PERCENTAGE = 10;
    
    // Voting delay: 1 day (7200 blocks at ~12s per block)
    uint256 private constant VOTING_DELAY = 7200;
    
    // Voting period: 1 week (50400 blocks)
    uint256 private constant VOTING_PERIOD = 50400;
    
    // Proposal threshold: 0.1% of total supply
    uint256 private constant PROPOSAL_THRESHOLD = 100; // basis points

    constructor(IVotes _token)
        Governor("ArcGovernance")
        GovernorSettings(
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(PRODUCTION_QUORUM_PERCENTAGE)
    {}

    /**
     * @dev Returns the quorum for a specific block number
     * @param blockNumber The block number to check quorum for
     * @return The number of votes required for quorum
     */
    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    /**
     * @dev Returns the voting delay
     */
    function votingDelay()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }

    /**
     * @dev Returns the voting period
     */
    function votingPeriod()
        public
        view
        override(IGovernor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }

    /**
     * @dev Returns the proposal threshold
     */
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }
}
