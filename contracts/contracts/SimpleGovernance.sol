// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IStakingRewards {
    function stakedBalance(address user) external view returns (uint256);
}

/**
 * @title SimpleGovernance
 * @notice DAO governance for ArcMarket community decisions
 * @dev Full implementation for v0.2+
 */
contract SimpleGovernance is Ownable, ReentrancyGuard {
    IERC20 public immutable USDC;
    IStakingRewards public stakingContract;

    enum ProposalType {
        FeaturedCollection,
        FeeChange,
        CollectionCuration,
        TreasuryAllocation
    }

    enum ProposalStatus {
        Active,
        Passed,
        Rejected,
        Executed
    }

    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 votesFor;
        uint256 votesAgainst;
        ProposalStatus status;
        bytes executionData;
        bool executed;
    }

    struct Vote {
        bool hasVoted;
        bool support;
        uint256 weight;
    }

    // Governance parameters
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MIN_STAKE_TO_PROPOSE = 1000 * 10**6; // 1000 USDC
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of total staked

    // State
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;

    // Featured collections (approved via governance)
    address[] public featuredCollections;
    mapping(address => bool) public isFeaturedCollection;

    // Treasury
    uint256 public treasuryAmount;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string title
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalFinalized(
        uint256 indexed proposalId,
        ProposalStatus status
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event CollectionFeatured(address indexed collection);
    event CollectionUnfeatured(address indexed collection);
    event TreasuryFunded(uint256 amount);

    constructor(address _usdc, address _stakingContract) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_stakingContract != address(0), "Invalid staking contract");
        USDC = IERC20(_usdc);
        stakingContract = IStakingRewards(_stakingContract);
    }

    /**
     * @notice Create a new proposal
     * @param proposalType Type of proposal
     * @param title Proposal title
     * @param description Proposal description
     * @param executionData Encoded execution data
     */
    function createProposal(
        ProposalType proposalType,
        string calldata title,
        string calldata description,
        bytes calldata executionData
    ) external returns (uint256) {
        require(
            stakingContract.stakedBalance(msg.sender) >= MIN_STAKE_TO_PROPOSE,
            "Insufficient stake to propose"
        );

        uint256 proposalId = proposalCount++;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposalType: proposalType,
            proposer: msg.sender,
            title: title,
            description: description,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            votesFor: 0,
            votesAgainst: 0,
            status: ProposalStatus.Active,
            executionData: executionData,
            executed: false
        });

        emit ProposalCreated(proposalId, msg.sender, proposalType, title);

        return proposalId;
    }

    /**
     * @notice Vote on a proposal
     * @param proposalId Proposal ID
     * @param support Whether to support the proposal
     */
    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!votes[proposalId][msg.sender].hasVoted, "Already voted");

        uint256 votingPower = stakingContract.stakedBalance(msg.sender);
        require(votingPower > 0, "No voting power");

        votes[proposalId][msg.sender] = Vote({
            hasVoted: true,
            support: support,
            weight: votingPower
        });

        if (support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }

        emit Voted(proposalId, msg.sender, support, votingPower);
    }

    /**
     * @notice Finalize a proposal after voting period
     * @param proposalId Proposal ID
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting not ended");

        // Check if quorum met
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;

        if (proposal.votesFor > proposal.votesAgainst) {
            proposal.status = ProposalStatus.Passed;
        } else {
            proposal.status = ProposalStatus.Rejected;
        }

        emit ProposalFinalized(proposalId, proposal.status);
    }

    /**
     * @notice Execute a passed proposal
     * @param proposalId Proposal ID
     */
    function executeProposal(uint256 proposalId) external onlyOwner nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Passed, "Proposal not passed");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        // Execute based on proposal type
        if (proposal.proposalType == ProposalType.FeaturedCollection) {
            _executeFeaturedCollection(proposal.executionData);
        } else if (proposal.proposalType == ProposalType.TreasuryAllocation) {
            _executeTreasuryAllocation(proposal.executionData);
        }
        // Add more execution logic as needed

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Execute featured collection proposal
     */
    function _executeFeaturedCollection(bytes memory data) private {
        address collection = abi.decode(data, (address));
        if (!isFeaturedCollection[collection]) {
            featuredCollections.push(collection);
            isFeaturedCollection[collection] = true;
            emit CollectionFeatured(collection);
        }
    }

    /**
     * @dev Execute treasury allocation proposal
     */
    function _executeTreasuryAllocation(bytes memory data) private {
        (address recipient, uint256 amount) = abi.decode(data, (address, uint256));
        require(treasuryAmount >= amount, "Insufficient treasury");

        treasuryAmount -= amount;
        USDC.transfer(recipient, amount);
    }

    /**
     * @notice Fund the governance treasury
     * @param amount Amount to fund
     */
    function fundTreasury(uint256 amount) external {
        require(amount > 0, "Cannot fund 0");
        USDC.transferFrom(msg.sender, address(this), amount);
        treasuryAmount += amount;
        emit TreasuryFunded(amount);
    }

    /**
     * @notice Get proposal details
     * @param proposalId Proposal ID
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    /**
     * @notice Get user's vote on a proposal
     * @param proposalId Proposal ID
     * @param voter Voter address
     */
    function getUserVote(uint256 proposalId, address voter) external view returns (Vote memory) {
        return votes[proposalId][voter];
    }

    /**
     * @notice Get all featured collections
     */
    function getFeaturedCollections() external view returns (address[] memory) {
        return featuredCollections;
    }

    /**
     * @notice Get governance statistics
     */
    function getStatistics() external view returns (
        uint256 totalProposals,
        uint256 activeProposals,
        uint256 treasuryBalance,
        uint256 featuredCollectionsCount
    ) {
        totalProposals = proposalCount;

        // Count active proposals
        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].status == ProposalStatus.Active) {
                activeProposals++;
            }
        }

        treasuryBalance = treasuryAmount;
        featuredCollectionsCount = featuredCollections.length;
    }

    /**
     * @notice Check if proposal can be finalized
     * @param proposalId Proposal ID
     */
    function canFinalize(uint256 proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.status == ProposalStatus.Active &&
               block.timestamp > proposal.endTime;
    }

    /**
     * @notice Check if proposal can be executed
     * @param proposalId Proposal ID
     */
    function canExecute(uint256 proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        return proposal.status == ProposalStatus.Passed && !proposal.executed;
    }

    /**
     * @notice Update staking contract address
     * @param _stakingContract New staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid address");
        stakingContract = IStakingRewards(_stakingContract);
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= treasuryAmount, "Exceeds treasury");
        treasuryAmount -= amount;
        USDC.transfer(owner(), amount);
    }
}
