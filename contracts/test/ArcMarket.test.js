const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArcMarket Full Test Suite", function () {
  let usdc, nft, marketplace, staking, governance;
  let owner, seller, buyer, creator, voter;

  beforeEach(async function () {
    [owner, seller, buyer, creator, voter] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy ArcMarketNFT
    const ArcMarketNFT = await ethers.getContractFactory("ArcMarketNFT");
    nft = await ArcMarketNFT.deploy();
    await nft.waitForDeployment();

    // Deploy ArcStaking
    const ArcStaking = await ethers.getContractFactory("ArcStaking");
    staking = await ArcStaking.deploy(await usdc.getAddress());
    await staking.waitForDeployment();

    // Deploy ArcMarketplace
    const ArcMarketplace = await ethers.getContractFactory("ArcMarketplace");
    marketplace = await ArcMarketplace.deploy(
      await usdc.getAddress(),
      owner.address
    );
    await marketplace.waitForDeployment();

    // Set staking contract in marketplace
    await marketplace.setStakingContract(await staking.getAddress());

    // Deploy ArcGovernance
    const ArcGovernance = await ethers.getContractFactory("ArcGovernance");
    governance = await ArcGovernance.deploy(
      await usdc.getAddress(),
      await staking.getAddress()
    );
    await governance.waitForDeployment();

    // Distribute USDC to test accounts
    await usdc.transfer(seller.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(buyer.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(creator.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(voter.address, ethers.parseUnits("10000", 6));
  });

  describe("ArcMarketNFT", function () {
    it("Should mint NFT with royalty", async function () {
      const tokenURI = "ipfs://test";
      const royaltyReceiver = creator.address;
      const royaltyFee = 500; // 5%

      await nft.connect(seller).mint(
        seller.address,
        tokenURI,
        royaltyReceiver,
        royaltyFee
      );

      expect(await nft.ownerOf(0)).to.equal(seller.address);
      expect(await nft.tokenURI(0)).to.equal(tokenURI);
      expect(await nft.tokenCreator(0)).to.equal(seller.address);
    });

    it("Should batch mint NFTs", async function () {
      const uris = ["ipfs://1", "ipfs://2", "ipfs://3"];
      const royaltyReceiver = creator.address;
      const royaltyFee = 500;

      await nft.connect(seller).batchMint(
        seller.address,
        uris,
        royaltyReceiver,
        royaltyFee
      );

      expect(await nft.totalSupply()).to.equal(3);
      expect(await nft.ownerOf(0)).to.equal(seller.address);
      expect(await nft.ownerOf(1)).to.equal(seller.address);
      expect(await nft.ownerOf(2)).to.equal(seller.address);
    });

    it("Should verify creators", async function () {
      await nft.verifyCreator(creator.address);
      expect(await nft.isVerifiedCreator(creator.address)).to.be.true;

      await nft.unverifyCreator(creator.address);
      expect(await nft.isVerifiedCreator(creator.address)).to.be.false;
    });
  });

  describe("ArcMarketplace", function () {
    beforeEach(async function () {
      // Mint NFT for seller
      await nft.connect(seller).mint(
        seller.address,
        "ipfs://test",
        creator.address,
        500
      );

      // Approve marketplace
      await nft.connect(seller).setApprovalForAll(
        await marketplace.getAddress(),
        true
      );
    });

    it("Should create and buy listing", async function () {
      const price = ethers.parseUnits("100", 6);

      // Create listing
      await marketplace.connect(seller).createListing(
        await nft.getAddress(),
        0,
        price
      );

      // Approve USDC
      await usdc.connect(buyer).approve(
        await marketplace.getAddress(),
        price
      );

      // Buy listing
      await marketplace.connect(buyer).buyListing(0);

      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should create and end auction", async function () {
      const startingPrice = ethers.parseUnits("50", 6);
      const duration = 86400; // 1 day

      // Create auction
      await marketplace.connect(seller).createAuction(
        await nft.getAddress(),
        0,
        startingPrice,
        duration
      );

      // Place bid
      const bidAmount = ethers.parseUnits("100", 6);
      await usdc.connect(buyer).approve(
        await marketplace.getAddress(),
        bidAmount
      );
      await marketplace.connect(buyer).placeBid(0, bidAmount);

      // Fast forward time
      await time.increase(duration + 1);

      // End auction
      await marketplace.endAuction(0);

      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should batch create listings", async function () {
      // Mint more NFTs
      await nft.connect(seller).mint(
        seller.address,
        "ipfs://test2",
        creator.address,
        500
      );
      await nft.connect(seller).mint(
        seller.address,
        "ipfs://test3",
        creator.address,
        500
      );

      const tokenIds = [0, 1, 2];
      const prices = [
        ethers.parseUnits("100", 6),
        ethers.parseUnits("200", 6),
        ethers.parseUnits("300", 6),
      ];

      await marketplace.connect(seller).batchCreateListing(
        await nft.getAddress(),
        tokenIds,
        prices
      );

      expect(await marketplace.listingIdCounter()).to.equal(3);
    });

    it("Should cancel listing", async function () {
      const price = ethers.parseUnits("100", 6);

      await marketplace.connect(seller).createListing(
        await nft.getAddress(),
        0,
        price
      );

      await marketplace.connect(seller).cancelListing(0);

      const listing = await marketplace.listings(0);
      expect(listing.active).to.be.false;
      expect(await nft.ownerOf(0)).to.equal(seller.address);
    });
  });

  describe("ArcStaking", function () {
    it("Should stake and get tier", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);

      await usdc.connect(seller).approve(
        await staking.getAddress(),
        stakeAmount
      );
      await staking.connect(seller).stake(stakeAmount);

      const stakeInfo = await staking.getStakeInfo(seller.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
      expect(stakeInfo.tier).to.equal(2); // Silver tier
    });

    it("Should upgrade tier when staking more", async function () {
      // Stake to Bronze
      let stakeAmount = ethers.parseUnits("100", 6);
      await usdc.connect(seller).approve(
        await staking.getAddress(),
        stakeAmount
      );
      await staking.connect(seller).stake(stakeAmount);

      let stakeInfo = await staking.getStakeInfo(seller.address);
      expect(stakeInfo.tier).to.equal(1); // Bronze

      // Stake more to reach Gold
      stakeAmount = ethers.parseUnits("2000", 6);
      await usdc.connect(seller).approve(
        await staking.getAddress(),
        stakeAmount
      );
      await staking.connect(seller).stake(stakeAmount);

      stakeInfo = await staking.getStakeInfo(seller.address);
      expect(stakeInfo.tier).to.equal(3); // Gold
    });

    it("Should unstake", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);

      await usdc.connect(seller).approve(
        await staking.getAddress(),
        stakeAmount
      );
      await staking.connect(seller).stake(stakeAmount);

      await staking.connect(seller).unstake(stakeAmount);

      const stakeInfo = await staking.getStakeInfo(seller.address);
      expect(stakeInfo.amount).to.equal(0);
    });

    it("Should earn and claim rewards", async function () {
      // Fund reward pool
      const fundAmount = ethers.parseUnits("10000", 6);
      await usdc.approve(await staking.getAddress(), fundAmount);
      await staking.fundRewardPool(fundAmount);

      // Stake
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(seller).approve(
        await staking.getAddress(),
        stakeAmount
      );
      await staking.connect(seller).stake(stakeAmount);

      // Fast forward time
      await time.increase(86400); // 1 day

      // Check earned rewards
      const earned = await staking.earned(seller.address);
      expect(earned).to.be.gt(0);

      // Claim rewards
      await staking.connect(seller).claimReward();

      const stakeInfo = await staking.getStakeInfo(seller.address);
      expect(stakeInfo.rewards).to.equal(0);
    });

    it("Should update leaderboard", async function () {
      // Stake from multiple accounts
      const amounts = [
        ethers.parseUnits("1000", 6),
        ethers.parseUnits("5000", 6),
        ethers.parseUnits("500", 6),
      ];

      await usdc.connect(seller).approve(
        await staking.getAddress(),
        amounts[0]
      );
      await staking.connect(seller).stake(amounts[0]);

      await usdc.connect(buyer).approve(
        await staking.getAddress(),
        amounts[1]
      );
      await staking.connect(buyer).stake(amounts[1]);

      await usdc.connect(creator).approve(
        await staking.getAddress(),
        amounts[2]
      );
      await staking.connect(creator).stake(amounts[2]);

      const [stakers, stakedAmounts, tiers] = await staking.getTopStakers(3);

      expect(stakers[0]).to.equal(buyer.address);
      expect(stakedAmounts[0]).to.equal(amounts[1]);
    });
  });

  describe("ArcGovernance", function () {
    beforeEach(async function () {
      // Stake to get voting power
      const stakeAmount = ethers.parseUnits("2000", 6);
      await usdc.connect(voter).approve(
        await staking.getAddress(),
        stakeAmount
      );
      await staking.connect(voter).stake(stakeAmount);
    });

    it("Should create proposal", async function () {
      const proposalData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await nft.getAddress()]
      );

      await governance.connect(voter).createProposal(
        0, // FeaturedCollection
        "Feature Test Collection",
        "This collection should be featured",
        proposalData
      );

      const proposal = await governance.getProposal(0);
      expect(proposal.title).to.equal("Feature Test Collection");
      expect(proposal.status).to.equal(0); // Active
    });

    it("Should vote on proposal", async function () {
      const proposalData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await nft.getAddress()]
      );

      await governance.connect(voter).createProposal(
        0,
        "Feature Test Collection",
        "This collection should be featured",
        proposalData
      );

      await governance.connect(voter).vote(0, true);

      const userVote = await governance.getUserVote(0, voter.address);
      expect(userVote.hasVoted).to.be.true;
      expect(userVote.support).to.be.true;
    });

    it("Should finalize and execute proposal", async function () {
      const proposalData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await nft.getAddress()]
      );

      await governance.connect(voter).createProposal(
        0,
        "Feature Test Collection",
        "This collection should be featured",
        proposalData
      );

      await governance.connect(voter).vote(0, true);

      // Fast forward time
      await time.increase(7 * 86400 + 1); // 7 days + 1 second

      await governance.finalizeProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.status).to.equal(1); // Passed

      await governance.executeProposal(0);

      const featuredCollections = await governance.getFeaturedCollections();
      expect(featuredCollections[0]).to.equal(await nft.getAddress());
    });

    it("Should fund treasury", async function () {
      const amount = ethers.parseUnits("1000", 6);
      await usdc.connect(owner).approve(
        await governance.getAddress(),
        amount
      );
      await governance.connect(owner).fundTreasury(amount);

      const stats = await governance.getStatistics();
      expect(stats.treasuryAmount).to.equal(amount);
    });
  });

  describe("Integration Tests", function () {
    it("Should handle full marketplace flow with staking discount", async function () {
      // Stake to get discount
      const stakeAmount = ethers.parseUnits("2000", 6);
      await usdc.connect(buyer).approve(
        await staking.getAddress(),
        stakeAmount
      );
      await staking.connect(buyer).stake(stakeAmount);

      // Mint NFT
      await nft.connect(seller).mint(
        seller.address,
        "ipfs://test",
        creator.address,
        500
      );

      // Approve and list NFT
      await nft.connect(seller).setApprovalForAll(
        await marketplace.getAddress(),
        true
      );

      const price = ethers.parseUnits("1000", 6);
      await marketplace.connect(seller).createListing(
        await nft.getAddress(),
        0,
        price
      );

      // Buy NFT
      await usdc.connect(buyer).approve(
        await marketplace.getAddress(),
        price
      );
      await marketplace.connect(buyer).buyListing(0);

      expect(await nft.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should distribute royalties correctly", async function () {
      // Mint NFT with royalty
      await nft.connect(seller).mint(
        seller.address,
        "ipfs://test",
        creator.address,
        500 // 5%
      );

      // List NFT
      await nft.connect(seller).setApprovalForAll(
        await marketplace.getAddress(),
        true
      );

      const price = ethers.parseUnits("1000", 6);
      await marketplace.connect(seller).createListing(
        await nft.getAddress(),
        0,
        price
      );

      const creatorBalanceBefore = await usdc.balanceOf(creator.address);

      // Buy NFT
      await usdc.connect(buyer).approve(
        await marketplace.getAddress(),
        price
      );
      await marketplace.connect(buyer).buyListing(0);

      const creatorBalanceAfter = await usdc.balanceOf(creator.address);
      const royaltyReceived = creatorBalanceAfter - creatorBalanceBefore;

      // Check royalty amount (5% of 1000 = 50 USDC)
      expect(royaltyReceived).to.equal(ethers.parseUnits("50", 6));
    });
  });
});
