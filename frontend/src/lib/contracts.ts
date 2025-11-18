// Contract addresses (update after deployment)
export const CONTRACTS = {
  USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x',
  NFT: process.env.NEXT_PUBLIC_NFT_ADDRESS || '0x',
  MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '0x',
  STAKING: process.env.NEXT_PUBLIC_STAKING_ADDRESS || '0x',
  GOVERNANCE: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || '0x',
};

// Simplified ABIs for frontend use
export const ABIS = {
  NFT: [
    'function mint(address to, string memory uri, address royaltyReceiver, uint96 royaltyFeeNumerator) returns (uint256)',
    'function batchMint(address to, string[] memory uris, address royaltyReceiver, uint96 royaltyFeeNumerator) returns (uint256[])',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function totalSupply() view returns (uint256)',
    'function setApprovalForAll(address operator, bool approved)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
  ],

  MARKETPLACE: [
    'function createListing(address nftContract, uint256 tokenId, uint256 price) returns (uint256)',
    'function batchCreateListing(address nftContract, uint256[] tokenIds, uint256[] prices) returns (uint256[])',
    'function buyListing(uint256 listingId)',
    'function batchBuyListings(uint256[] listingIds)',
    'function cancelListing(uint256 listingId)',
    'function createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 duration) returns (uint256)',
    'function placeBid(uint256 auctionId, uint256 bidAmount)',
    'function endAuction(uint256 auctionId)',
    'function cancelAuction(uint256 auctionId)',
    'function listings(uint256 listingId) view returns (address seller, address nftContract, uint256 tokenId, uint256 price, bool active)',
    'function auctions(uint256 auctionId) view returns (address seller, address nftContract, uint256 tokenId, uint256 startingPrice, uint256 highestBid, address highestBidder, uint256 endTime, bool active)',
    'function getActiveListingsCount() view returns (uint256)',
    'function getActiveAuctionsCount() view returns (uint256)',
  ],

  STAKING: [
    'function stake(uint256 amount)',
    'function unstake(uint256 amount)',
    'function claimReward()',
    'function getStakeInfo(address user) view returns (uint256 amount, uint256 stakedAt, uint256 rewards, uint8 tier, uint256 feeDiscount)',
    'function getTopStakers(uint256 count) view returns (address[] stakers, uint256[] amounts, uint8[] tiers)',
    'function getTier(uint256 amount) pure returns (uint8)',
    'function earned(address account) view returns (uint256)',
    'function getStatistics() view returns (uint256 totalStaked, uint256 rewardPool, uint256 rewardRate, uint256 totalStakers)',
  ],

  GOVERNANCE: [
    'function createProposal(uint8 proposalType, string title, string description, bytes executionData) returns (uint256)',
    'function vote(uint256 proposalId, bool support)',
    'function finalizeProposal(uint256 proposalId)',
    'function executeProposal(uint256 proposalId)',
    'function getProposal(uint256 proposalId) view returns (uint8 proposalType, address proposer, string title, string description, uint256 startTime, uint256 endTime, uint256 votesFor, uint256 votesAgainst, uint8 status, bool executed)',
    'function getUserVote(uint256 proposalId, address user) view returns (bool hasVoted, bool support, uint256 weight)',
    'function getFeaturedCollections() view returns (address[])',
    'function getCuratedCollections() view returns (address[])',
    'function getStatistics() view returns (uint256 totalProposals, uint256 activeProposals, uint256 passedProposals, uint256 treasuryAmount, uint256 featuredCount, uint256 curatedCount)',
  ],

  USDC: [
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
  ],
};

// Tier enum for TypeScript
export enum StakingTier {
  None = 0,
  Bronze = 1,
  Silver = 2,
  Gold = 3,
  Platinum = 4,
}

export const TIER_NAMES = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum'];
export const TIER_REQUIREMENTS = [0, 100, 500, 2000, 10000]; // in USDC
export const TIER_DISCOUNTS = [0, 10, 20, 35, 50]; // in percentage

// Proposal types
export enum ProposalType {
  FeaturedCollection = 0,
  FeeChange = 1,
  CollectionCuration = 2,
  TreasuryAllocation = 3,
}

// Proposal status
export enum ProposalStatus {
  Active = 0,
  Passed = 1,
  Rejected = 2,
  Executed = 3,
}
