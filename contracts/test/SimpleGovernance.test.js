const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArcMarket v0.2 - SimpleGovernance", function () {
  let usdc, staking, governance, nft;
  let owner, user1, user2, user3, user4;
  let usdcAddress, stakingAddress, governanceAddress, nftAddress;

  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const MIN_STAKE_TO_PROPOSE = ethers.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    usdcAddress = await usdc.getAddress();

    // Deploy StakingRewards
    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    staking = await StakingRewards.deploy(usdcAddress);
    await staking.waitForDeployment();
    stakingAddress = await staking.getAddress();

    // Deploy SimpleGovernance
    const SimpleGovernance = await ethers.getContractFactory("SimpleGovernance");
    governance = await SimpleGovernance.deploy(usdcAddress, stakingAddress);
    await governance.waitForDeployment();
    governanceAddress = await governance.getAddress();

    // Deploy test NFT
    const ArcMarketNFT = await ethers.getContractFactory("ArcMarketNFT");
    nft = await ArcMarketNFT.deploy();
    await nft.waitForDeployment();
    nftAddress = await nft.getAddress();

    // Distribute USDC to test accounts
    const fundAmount = ethers.parseUnits("50000", 6); // 50k USDC each
    await usdc.transfer(user1.address, fundAmount);
    await usdc.transfer(user2.address, fundAmount);
    await usdc.transfer(user3.address, fundAmount);
    await usdc.transfer(user4.address, fundAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await governance.USDC()).to.equal(usdcAddress);
    });

    it("Should set the correct staking contract address", async function () {
      expect(await governance.stakingContract()).to.equal(stakingAddress);
    });

    it("Should set owner correctly", async function () {
      expect(await governance.owner()).to.equal(owner.address);
    });

    it("Should have correct governance parameters", async function () {
      expect(await governance.VOTING_PERIOD()).to.equal(VOTING_PERIOD);
      expect(await governance.MIN_STAKE_TO_PROPOSE()).to.equal(MIN_STAKE_TO_PROPOSE);
      expect(await governance.QUORUM_PERCENTAGE()).to.equal(10);
    });
  });

  describe("Proposal Creation", function () {
    beforeEach(async function () {
      // User1 stakes enough to create proposals
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
    });

    it("Should allow users with sufficient stake to create proposals", async function () {
      const title = "Feature Collection XYZ";
      const description = "Proposal to add XYZ collection as featured";
      const executionData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [nftAddress]
      );

      await expect(
        governance.connect(user1).createProposal(
          0, // FeaturedCollection
          title,
          description,
          executionData
        )
      )
        .to.emit(governance, "ProposalCreated")
        .withArgs(0, user1.address, 0, title);

      const proposal = await governance.getProposal(0);
      expect(proposal.id).to.equal(0);
      expect(proposal.proposer).to.equal(user1.address);
      expect(proposal.title).to.equal(title);
      expect(proposal.description).to.equal(description);
      expect(proposal.status).to.equal(0); // Active
    });

    it("Should revert when creating proposal without sufficient stake", async function () {
      const title = "Test Proposal";
      const description = "Test Description";
      const executionData = "0x";

      await expect(
        governance.connect(user2).createProposal(0, title, description, executionData)
      ).to.be.revertedWith("Insufficient stake to propose");
    });

    it("Should create proposals of different types", async function () {
      const executionData = "0x";

      // FeaturedCollection
      await governance.connect(user1).createProposal(0, "Title 1", "Desc 1", executionData);
      let proposal = await governance.getProposal(0);
      expect(proposal.proposalType).to.equal(0);

      // FeeChange
      await governance.connect(user1).createProposal(1, "Title 2", "Desc 2", executionData);
      proposal = await governance.getProposal(1);
      expect(proposal.proposalType).to.equal(1);

      // CollectionCuration
      await governance.connect(user1).createProposal(2, "Title 3", "Desc 3", executionData);
      proposal = await governance.getProposal(2);
      expect(proposal.proposalType).to.equal(2);

      // TreasuryAllocation
      await governance.connect(user1).createProposal(3, "Title 4", "Desc 4", executionData);
      proposal = await governance.getProposal(3);
      expect(proposal.proposalType).to.equal(3);

      expect(await governance.proposalCount()).to.equal(4);
    });

    it("Should set correct proposal timing", async function () {
      const blockTimestamp = await time.latest();

      await governance.connect(user1).createProposal(0, "Test", "Test", "0x");

      const proposal = await governance.getProposal(0);
      expect(proposal.startTime).to.be.closeTo(blockTimestamp + 1, 5);
      expect(proposal.endTime).to.equal(proposal.startTime + BigInt(VOTING_PERIOD));
    });
  });

  describe("Voting", function () {
    let proposalId;

    beforeEach(async function () {
      // User1 creates proposal
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      const tx = await governance.connect(user1).createProposal(
        0,
        "Test Proposal",
        "Test Description",
        "0x"
      );
      const receipt = await tx.wait();
      proposalId = 0;

      // User2 and User3 stake to get voting power
      await usdc.connect(user2).approve(stakingAddress, ethers.parseUnits("2000", 6));
      await staking.connect(user2).stake(ethers.parseUnits("2000", 6));

      await usdc.connect(user3).approve(stakingAddress, ethers.parseUnits("500", 6));
      await staking.connect(user3).stake(ethers.parseUnits("500", 6));
    });

    it("Should allow users with staked tokens to vote", async function () {
      const votingPower = await staking.stakedBalance(user2.address);

      await expect(governance.connect(user2).vote(proposalId, true))
        .to.emit(governance, "Voted")
        .withArgs(proposalId, user2.address, true, votingPower);

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.votesFor).to.equal(votingPower);
      expect(proposal.votesAgainst).to.equal(0);
    });

    it("Should record votes correctly", async function () {
      await governance.connect(user2).vote(proposalId, true);

      const vote = await governance.getUserVote(proposalId, user2.address);
      expect(vote.hasVoted).to.be.true;
      expect(vote.support).to.be.true;
      expect(vote.weight).to.equal(await staking.stakedBalance(user2.address));
    });

    it("Should count votes for and against separately", async function () {
      await governance.connect(user2).vote(proposalId, true);
      await governance.connect(user3).vote(proposalId, false);

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.votesFor).to.equal(await staking.stakedBalance(user2.address));
      expect(proposal.votesAgainst).to.equal(await staking.stakedBalance(user3.address));
    });

    it("Should revert when voting twice", async function () {
      await governance.connect(user2).vote(proposalId, true);

      await expect(
        governance.connect(user2).vote(proposalId, false)
      ).to.be.revertedWith("Already voted");
    });

    it("Should revert when voting without staking power", async function () {
      await expect(
        governance.connect(user4).vote(proposalId, true)
      ).to.be.revertedWith("No voting power");
    });

    it("Should revert when voting after voting period ends", async function () {
      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);

      await expect(
        governance.connect(user2).vote(proposalId, true)
      ).to.be.revertedWith("Voting ended");
    });

    it("Should use weighted voting based on staked amount", async function () {
      // User2 has 2000 USDC staked
      // User3 has 500 USDC staked
      await governance.connect(user2).vote(proposalId, true);
      await governance.connect(user3).vote(proposalId, true);

      const proposal = await governance.getProposal(proposalId);
      const expectedVotes = ethers.parseUnits("2500", 6); // 2000 + 500
      expect(proposal.votesFor).to.equal(expectedVotes);
    });
  });

  describe("Proposal Finalization", function () {
    let proposalId;

    beforeEach(async function () {
      // Setup: Create proposal and stake for users
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await governance.connect(user1).createProposal(
        0,
        "Test Proposal",
        "Test Description",
        "0x"
      );
      proposalId = 0;

      await usdc.connect(user2).approve(stakingAddress, ethers.parseUnits("2000", 6));
      await staking.connect(user2).stake(ethers.parseUnits("2000", 6));

      await usdc.connect(user3).approve(stakingAddress, ethers.parseUnits("500", 6));
      await staking.connect(user3).stake(ethers.parseUnits("500", 6));
    });

    it("Should finalize proposal with majority votes as Passed", async function () {
      // Vote in favor
      await governance.connect(user2).vote(proposalId, true);
      await governance.connect(user3).vote(proposalId, true);

      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);

      await expect(governance.finalizeProposal(proposalId))
        .to.emit(governance, "ProposalFinalized")
        .withArgs(proposalId, 1); // Passed = 1

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.status).to.equal(1); // Passed
    });

    it("Should finalize proposal with minority votes as Rejected", async function () {
      // Vote against
      await governance.connect(user2).vote(proposalId, false);

      // Fast forward past voting period
      await time.increase(VOTING_PERIOD + 1);

      await expect(governance.finalizeProposal(proposalId))
        .to.emit(governance, "ProposalFinalized")
        .withArgs(proposalId, 2); // Rejected = 2

      const proposal = await governance.getProposal(proposalId);
      expect(proposal.status).to.equal(2); // Rejected
    });

    it("Should revert finalization before voting period ends", async function () {
      await expect(
        governance.finalizeProposal(proposalId)
      ).to.be.revertedWith("Voting not ended");
    });

    it("Should revert finalization of already finalized proposal", async function () {
      await time.increase(VOTING_PERIOD + 1);
      await governance.finalizeProposal(proposalId);

      await expect(
        governance.finalizeProposal(proposalId)
      ).to.be.revertedWith("Proposal not active");
    });

    it("Should allow anyone to finalize proposal", async function () {
      await governance.connect(user2).vote(proposalId, true);
      await time.increase(VOTING_PERIOD + 1);

      // User4 (non-stakeholder) can finalize
      await expect(governance.connect(user4).finalizeProposal(proposalId))
        .to.emit(governance, "ProposalFinalized");
    });
  });

  describe("Proposal Execution", function () {
    let proposalId;

    beforeEach(async function () {
      // Setup staking
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await usdc.connect(user2).approve(stakingAddress, ethers.parseUnits("3000", 6));
      await staking.connect(user2).stake(ethers.parseUnits("3000", 6));
    });

    it("Should execute FeaturedCollection proposal", async function () {
      const executionData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [nftAddress]
      );

      await governance.connect(user1).createProposal(
        0, // FeaturedCollection
        "Feature NFT Collection",
        "Add this collection as featured",
        executionData
      );
      proposalId = 0;

      // Vote and finalize
      await governance.connect(user2).vote(proposalId, true);
      await time.increase(VOTING_PERIOD + 1);
      await governance.finalizeProposal(proposalId);

      // Execute
      await expect(governance.executeProposal(proposalId))
        .to.emit(governance, "ProposalExecuted")
        .withArgs(proposalId)
        .and.to.emit(governance, "CollectionFeatured")
        .withArgs(nftAddress);

      expect(await governance.isFeaturedCollection(nftAddress)).to.be.true;
      const featured = await governance.getFeaturedCollections();
      expect(featured[0]).to.equal(nftAddress);
    });

    it("Should execute TreasuryAllocation proposal", async function () {
      // Fund treasury first
      const treasuryFund = ethers.parseUnits("5000", 6);
      await usdc.connect(owner).approve(governanceAddress, treasuryFund);
      await governance.fundTreasury(treasuryFund);

      const allocationAmount = ethers.parseUnits("1000", 6);
      const executionData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [user3.address, allocationAmount]
      );

      await governance.connect(user1).createProposal(
        3, // TreasuryAllocation
        "Allocate Treasury Funds",
        "Allocate 1000 USDC to user3",
        executionData
      );
      proposalId = 0;

      // Vote and finalize
      await governance.connect(user2).vote(proposalId, true);
      await time.increase(VOTING_PERIOD + 1);
      await governance.finalizeProposal(proposalId);

      // Execute
      const user3BalanceBefore = await usdc.balanceOf(user3.address);
      await governance.executeProposal(proposalId);
      const user3BalanceAfter = await usdc.balanceOf(user3.address);

      expect(user3BalanceAfter - user3BalanceBefore).to.equal(allocationAmount);
      expect(await governance.treasuryAmount()).to.equal(treasuryFund - allocationAmount);
    });

    it("Should revert execution of non-passed proposal", async function () {
      const executionData = "0x";
      await governance.connect(user1).createProposal(0, "Test", "Test", executionData);
      proposalId = 0;

      // Vote against and finalize
      await governance.connect(user2).vote(proposalId, false);
      await time.increase(VOTING_PERIOD + 1);
      await governance.finalizeProposal(proposalId);

      await expect(
        governance.executeProposal(proposalId)
      ).to.be.revertedWith("Proposal not passed");
    });

    it("Should revert double execution", async function () {
      const executionData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [nftAddress]
      );

      await governance.connect(user1).createProposal(0, "Test", "Test", executionData);
      proposalId = 0;

      await governance.connect(user2).vote(proposalId, true);
      await time.increase(VOTING_PERIOD + 1);
      await governance.finalizeProposal(proposalId);

      await governance.executeProposal(proposalId);

      await expect(
        governance.executeProposal(proposalId)
      ).to.be.revertedWith("Already executed");
    });

    it("Should revert execution from non-owner", async function () {
      const executionData = "0x";
      await governance.connect(user1).createProposal(0, "Test", "Test", executionData);
      proposalId = 0;

      await governance.connect(user2).vote(proposalId, true);
      await time.increase(VOTING_PERIOD + 1);
      await governance.finalizeProposal(proposalId);

      await expect(
        governance.connect(user1).executeProposal(proposalId)
      ).to.be.revertedWithCustomError(governance, "OwnableUnauthorizedAccount");
    });
  });

  describe("Treasury Management", function () {
    it("Should allow funding the treasury", async function () {
      const fundAmount = ethers.parseUnits("5000", 6);
      await usdc.connect(owner).approve(governanceAddress, fundAmount);

      await expect(governance.fundTreasury(fundAmount))
        .to.emit(governance, "TreasuryFunded")
        .withArgs(fundAmount);

      expect(await governance.treasuryAmount()).to.equal(fundAmount);
    });

    it("Should revert funding with zero amount", async function () {
      await expect(
        governance.fundTreasury(0)
      ).to.be.revertedWith("Cannot fund 0");
    });

    it("Should allow multiple treasury contributions", async function () {
      const fund1 = ethers.parseUnits("1000", 6);
      const fund2 = ethers.parseUnits("2000", 6);

      await usdc.connect(owner).approve(governanceAddress, fund1 + fund2);
      await governance.fundTreasury(fund1);
      await governance.fundTreasury(fund2);

      expect(await governance.treasuryAmount()).to.equal(fund1 + fund2);
    });
  });

  describe("View Functions", function () {
    it("Should return correct statistics", async function () {
      const [totalProposals, activeProposals, treasuryBalance, featuredCount] =
        await governance.getStatistics();

      expect(totalProposals).to.equal(0);
      expect(activeProposals).to.equal(0);
      expect(treasuryBalance).to.equal(0);
      expect(featuredCount).to.equal(0);
    });

    it("Should return correct canFinalize status", async function () {
      // Create proposal
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
      await governance.connect(user1).createProposal(0, "Test", "Test", "0x");

      expect(await governance.canFinalize(0)).to.be.false;

      await time.increase(VOTING_PERIOD + 1);
      expect(await governance.canFinalize(0)).to.be.true;
    });

    it("Should return correct canExecute status", async function () {
      // Create and pass proposal
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      await usdc.connect(user2).approve(stakingAddress, ethers.parseUnits("2000", 6));
      await staking.connect(user2).stake(ethers.parseUnits("2000", 6));

      await governance.connect(user1).createProposal(0, "Test", "Test", "0x");
      await governance.connect(user2).vote(0, true);

      expect(await governance.canExecute(0)).to.be.false;

      await time.increase(VOTING_PERIOD + 1);
      await governance.finalizeProposal(0);

      expect(await governance.canExecute(0)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update staking contract", async function () {
      const newStaking = user4.address; // Just for testing

      await governance.setStakingContract(newStaking);

      expect(await governance.stakingContract()).to.equal(newStaking);
    });

    it("Should revert staking contract update with zero address", async function () {
      await expect(
        governance.setStakingContract(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should revert staking contract update from non-owner", async function () {
      await expect(
        governance.connect(user1).setStakingContract(user4.address)
      ).to.be.revertedWithCustomError(governance, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to emergency withdraw", async function () {
      // Fund treasury
      const fundAmount = ethers.parseUnits("5000", 6);
      await usdc.connect(owner).approve(governanceAddress, fundAmount);
      await governance.fundTreasury(fundAmount);

      const ownerBalanceBefore = await usdc.balanceOf(owner.address);
      const withdrawAmount = ethers.parseUnits("1000", 6);

      await governance.emergencyWithdraw(withdrawAmount);

      const ownerBalanceAfter = await usdc.balanceOf(owner.address);
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(withdrawAmount);
      expect(await governance.treasuryAmount()).to.equal(fundAmount - withdrawAmount);
    });

    it("Should revert emergency withdraw exceeding treasury", async function () {
      const fundAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(owner).approve(governanceAddress, fundAmount);
      await governance.fundTreasury(fundAmount);

      await expect(
        governance.emergencyWithdraw(ethers.parseUnits("2000", 6))
      ).to.be.revertedWith("Exceeds treasury");
    });

    it("Should revert emergency withdraw from non-owner", async function () {
      await expect(
        governance.connect(user1).emergencyWithdraw(ethers.parseUnits("100", 6))
      ).to.be.revertedWithCustomError(governance, "OwnableUnauthorizedAccount");
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full governance cycle", async function () {
      // 1. Users stake to get voting power
      await usdc.connect(user1).approve(stakingAddress, ethers.parseUnits("1000", 6));
      await staking.connect(user1).stake(ethers.parseUnits("1000", 6));

      await usdc.connect(user2).approve(stakingAddress, ethers.parseUnits("3000", 6));
      await staking.connect(user2).stake(ethers.parseUnits("3000", 6));

      await usdc.connect(user3).approve(stakingAddress, ethers.parseUnits("500", 6));
      await staking.connect(user3).stake(ethers.parseUnits("500", 6));

      // 2. User1 creates proposal
      const executionData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [nftAddress]
      );

      await governance.connect(user1).createProposal(
        0,
        "Feature New Collection",
        "Add this amazing collection to featured list",
        executionData
      );

      // 3. Users vote
      await governance.connect(user1).vote(0, true);
      await governance.connect(user2).vote(0, true);
      await governance.connect(user3).vote(0, false);

      // 4. Wait for voting period
      await time.increase(VOTING_PERIOD + 1);

      // 5. Finalize proposal
      await governance.finalizeProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.status).to.equal(1); // Passed
      expect(proposal.votesFor).to.be.gt(proposal.votesAgainst);

      // 6. Execute proposal
      await governance.executeProposal(0);

      expect(await governance.isFeaturedCollection(nftAddress)).to.be.true;
    });

    it("Should handle multiple concurrent proposals", async function () {
      // Setup voting power
      await usdc.connect(user1).approve(stakingAddress, ethers.parseUnits("1000", 6));
      await staking.connect(user1).stake(ethers.parseUnits("1000", 6));

      await usdc.connect(user2).approve(stakingAddress, ethers.parseUnits("2000", 6));
      await staking.connect(user2).stake(ethers.parseUnits("2000", 6));

      // Create multiple proposals
      const data1 = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [nftAddress]);
      const data2 = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user4.address]);

      await governance.connect(user1).createProposal(0, "Proposal 1", "Desc 1", data1);
      await governance.connect(user1).createProposal(0, "Proposal 2", "Desc 2", data2);

      // Vote differently on each
      await governance.connect(user2).vote(0, true);
      await governance.connect(user2).vote(1, false);

      // Fast forward and finalize both
      await time.increase(VOTING_PERIOD + 1);

      await governance.finalizeProposal(0);
      await governance.finalizeProposal(1);

      const proposal1 = await governance.getProposal(0);
      const proposal2 = await governance.getProposal(1);

      expect(proposal1.status).to.equal(1); // Passed
      expect(proposal2.status).to.equal(2); // Rejected
    });

    it("Should integrate with staking for voting power changes", async function () {
      // User1 creates proposal
      await usdc.connect(user1).approve(stakingAddress, ethers.parseUnits("1000", 6));
      await staking.connect(user1).stake(ethers.parseUnits("1000", 6));

      await governance.connect(user1).createProposal(0, "Test", "Test", "0x");

      // User2 stakes and votes
      await usdc.connect(user2).approve(stakingAddress, ethers.parseUnits("500", 6));
      await staking.connect(user2).stake(ethers.parseUnits("500", 6));

      const votingPower = await staking.stakedBalance(user2.address);
      await governance.connect(user2).vote(0, true);

      const proposal = await governance.getProposal(0);
      expect(proposal.votesFor).to.equal(votingPower);

      // Even if user2 stakes more later, their vote weight doesn't change
      await usdc.connect(user2).approve(stakingAddress, ethers.parseUnits("1000", 6));
      await staking.connect(user2).stake(ethers.parseUnits("1000", 6));

      const proposalAfter = await governance.getProposal(0);
      expect(proposalAfter.votesFor).to.equal(votingPower); // Same as before
    });
  });
});
