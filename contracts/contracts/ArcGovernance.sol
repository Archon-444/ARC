// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ArcGovernance
 * @dev Simple DAO governance for community voting
 * Stakers can vote on proposals like featured collections, fee changes, and curation
 */
contract ArcGovernance is Ownable, ReentrancyGuard {
    IERC20 public usdc;
    address public stakingContract;

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
    uint256 public votingPeriod = 7 days;
    uint256 public proposalThreshold = 1000 * 10**6; // 1000 USDC staked
    uint256 public quorum = 5000; // 50% in basis points

    // Proposals
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // Votes: proposalId => voter => Vote
    mapping(uint256 => mapping(address => Vote)) public votes;

    // Treasury
    uint256 public treasuryBalance;

    // Featured collections (approved via governance)
    mapping(address => bool) public featuredCollections;
    address[] public featuredCollectionsList;

    // Curated collections (approved via governance)
    mapping(address => bool) public curatedCollections;
    address[] public curatedCollectionsList;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        ProposalType proposalType,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus status);
    event CollectionFeatured(address indexed collection);
    event CollectionCurated(address indexed collection);
    event TreasuryFunded(uint256 amount);

    constructor(address _usdc, address _stakingContract) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_stakingContract != address(0), "Invalid staking contract");
        usdc = IERC20(_usdc);
        stakingContract = _stakingContract;
    }

    /**
     * @dev Create a new proposal
     */
    function createProposal(
        ProposalType proposalType,
        string memory title,
        string memory description,
        bytes memory executionData
    ) external returns (uint256) {
        require(_getVotingPower(msg.sender) >= proposalThreshold, "Insufficient voting power");

        uint256 proposalId = proposalCount++;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposalType: proposalType,
            proposer: msg.sender,
            title: title,
            description: description,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            votesFor: 0,
            votesAgainst: 0,
            status: ProposalStatus.Active,
            executionData: executionData,
            executed: false
        });

        emit ProposalCreated(
            proposalId,
            proposalType,
            msg.sender,
            title,
            block.timestamp,
            block.timestamp + votingPeriod
        );

        return proposalId;
    }

    /**
     * @dev Vote on a proposal
     */
    function vote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");

        Vote storage userVote = votes[proposalId][msg.sender];
        require(!userVote.hasVoted, "Already voted");

        uint256 votingPower = _getVotingPower(msg.sender);
        require(votingPower > 0, "No voting power");

        userVote.hasVoted = true;
        userVote.support = support;
        userVote.weight = votingPower;

        if (support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }

        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }

    /**
     * @dev Finalize a proposal after voting period
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not ended");

        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 totalStaked = _getTotalStaked();

        // Check quorum
        if (totalVotes * 10000 < totalStaked * quorum) {
            proposal.status = ProposalStatus.Rejected;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Rejected);
            return;
        }

        // Check if passed
        if (proposal.votesFor > proposal.votesAgainst) {
            proposal.status = ProposalStatus.Passed;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Passed);
        } else {
            proposal.status = ProposalStatus.Rejected;
            emit ProposalStatusChanged(proposalId, ProposalStatus.Rejected);
        }
    }

    /**
     * @dev Execute a passed proposal
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Passed, "Proposal not passed");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        // Execute based on proposal type
        if (proposal.proposalType == ProposalType.FeaturedCollection) {
            address collection = abi.decode(proposal.executionData, (address));
            _featureCollection(collection);
        } else if (proposal.proposalType == ProposalType.CollectionCuration) {
            address collection = abi.decode(proposal.executionData, (address));
            _curateCollection(collection);
        } else if (proposal.proposalType == ProposalType.FeeChange) {
            // Fee change would be executed by marketplace owner
            // This just approves it via governance
        } else if (proposal.proposalType == ProposalType.TreasuryAllocation) {
            (address recipient, uint256 amount) = abi.decode(proposal.executionData, (address, uint256));
            _allocateTreasury(recipient, amount);
        }

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Feature a collection
     */
    function _featureCollection(address collection) internal {
        require(!featuredCollections[collection], "Already featured");
        featuredCollections[collection] = true;
        featuredCollectionsList.push(collection);
        emit CollectionFeatured(collection);
    }

    /**
     * @dev Curate a collection
     */
    function _curateCollection(address collection) internal {
        require(!curatedCollections[collection], "Already curated");
        curatedCollections[collection] = true;
        curatedCollectionsList.push(collection);
        emit CollectionCurated(collection);
    }

    /**
     * @dev Allocate treasury funds
     */
    function _allocateTreasury(address recipient, uint256 amount) internal {
        require(treasuryBalance >= amount, "Insufficient treasury");
        treasuryBalance -= amount;
        require(usdc.transfer(recipient, amount), "Transfer failed");
    }

    /**
     * @dev Get voting power from staking contract
     */
    function _getVotingPower(address user) internal view returns (uint256) {
        // Call staking contract to get user's staked amount
        (bool success, bytes memory data) = stakingContract.staticcall(
            abi.encodeWithSignature("stakes(address)", user)
        );

        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }

        return 0;
    }

    /**
     * @dev Get total staked from staking contract
     */
    function _getTotalStaked() internal view returns (uint256) {
        (bool success, bytes memory data) = stakingContract.staticcall(
            abi.encodeWithSignature("totalStaked()")
        );

        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }

        return 1; // Avoid division by zero
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (
        ProposalType proposalType,
        address proposer,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 votesFor,
        uint256 votesAgainst,
        ProposalStatus status,
        bool executed
    ) {
        Proposal memory proposal = proposals[proposalId];
        return (
            proposal.proposalType,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.status,
            proposal.executed
        );
    }

    /**
     * @dev Get user's vote on a proposal
     */
    function getUserVote(uint256 proposalId, address user) external view returns (
        bool hasVoted,
        bool support,
        uint256 weight
    ) {
        Vote memory userVote = votes[proposalId][user];
        return (userVote.hasVoted, userVote.support, userVote.weight);
    }

    /**
     * @dev Get featured collections
     */
    function getFeaturedCollections() external view returns (address[] memory) {
        return featuredCollectionsList;
    }

    /**
     * @dev Get curated collections
     */
    function getCuratedCollections() external view returns (address[] memory) {
        return curatedCollectionsList;
    }

    /**
     * @dev Fund treasury
     */
    function fundTreasury(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot fund 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        treasuryBalance += amount;
        emit TreasuryFunded(amount);
    }

    /**
     * @dev Update governance parameters (only owner)
     */
    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        votingPeriod = _votingPeriod;
    }

    function setProposalThreshold(uint256 _threshold) external onlyOwner {
        proposalThreshold = _threshold;
    }

    function setQuorum(uint256 _quorum) external onlyOwner {
        require(_quorum <= 10000, "Invalid quorum");
        quorum = _quorum;
    }

    /**
     * @dev Get governance statistics
     */
    function getStatistics() external view returns (
        uint256 totalProposals,
        uint256 activeProposals,
        uint256 passedProposals,
        uint256 treasuryAmount,
        uint256 featuredCount,
        uint256 curatedCount
    ) {
        uint256 active = 0;
        uint256 passed = 0;

        for (uint256 i = 0; i < proposalCount; i++) {
            if (proposals[i].status == ProposalStatus.Active) active++;
            if (proposals[i].status == ProposalStatus.Passed || proposals[i].status == ProposalStatus.Executed) passed++;
        }

        return (
            proposalCount,
            active,
            passed,
            treasuryBalance,
            featuredCollectionsList.length,
            curatedCollectionsList.length
        );
    }
}
