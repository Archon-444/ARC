const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArcMarket v0.2 - StakingRewards", function () {
  let usdc, staking;
  let owner, user1, user2, user3, user4;
  let usdcAddress, stakingAddress;

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

    // Distribute USDC to test accounts
    const fundAmount = ethers.parseUnits("50000", 6); // 50k USDC each
    await usdc.transfer(user1.address, fundAmount);
    await usdc.transfer(user2.address, fundAmount);
    await usdc.transfer(user3.address, fundAmount);
    await usdc.transfer(user4.address, fundAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await staking.USDC()).to.equal(usdcAddress);
    });

    it("Should initialize default tiers", async function () {
      const tiersCount = await staking.getTiersCount();
      expect(tiersCount).to.equal(4);

      const tiers = await staking.getAllTiers();

      // Bronze: 100 USDC, 10% discount
      expect(tiers[0].threshold).to.equal(ethers.parseUnits("100", 6));
      expect(tiers[0].feeDiscountBps).to.equal(1000);
      expect(tiers[0].name).to.equal("Bronze");

      // Silver: 500 USDC, 20% discount
      expect(tiers[1].threshold).to.equal(ethers.parseUnits("500", 6));
      expect(tiers[1].feeDiscountBps).to.equal(2000);
      expect(tiers[1].name).to.equal("Silver");

      // Gold: 2000 USDC, 35% discount
      expect(tiers[2].threshold).to.equal(ethers.parseUnits("2000", 6));
      expect(tiers[2].feeDiscountBps).to.equal(3500);
      expect(tiers[2].name).to.equal("Gold");

      // Platinum: 10000 USDC, 50% discount
      expect(tiers[3].threshold).to.equal(ethers.parseUnits("10000", 6));
      expect(tiers[3].feeDiscountBps).to.equal(5000);
      expect(tiers[3].name).to.equal("Platinum");
    });

    it("Should set owner correctly", async function () {
      expect(await staking.owner()).to.equal(owner.address);
    });
  });

  describe("Staking Functions", function () {
    it("Should allow users to stake USDC", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);

      await usdc.connect(user1).approve(stakingAddress, stakeAmount);

      await expect(staking.connect(user1).stake(stakeAmount))
        .to.emit(staking, "Staked")
        .withArgs(user1.address, stakeAmount);

      expect(await staking.stakedBalance(user1.address)).to.equal(stakeAmount);
      expect(await staking.totalStaked()).to.equal(stakeAmount);

      const stakeInfo = await staking.stakes(user1.address);
      expect(stakeInfo.amount).to.equal(stakeAmount);
    });

    it("Should revert when staking zero amount", async function () {
      await expect(
        staking.connect(user1).stake(0)
      ).to.be.revertedWith("Cannot stake 0");
    });

    it("Should allow multiple stakes from same user", async function () {
      const stake1 = ethers.parseUnits("500", 6);
      const stake2 = ethers.parseUnits("300", 6);

      await usdc.connect(user1).approve(stakingAddress, stake1 + stake2);

      await staking.connect(user1).stake(stake1);
      await staking.connect(user1).stake(stake2);

      expect(await staking.stakedBalance(user1.address)).to.equal(stake1 + stake2);
    });

    it("Should transfer USDC to staking contract", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);

      const balanceBefore = await usdc.balanceOf(stakingAddress);
      await staking.connect(user1).stake(stakeAmount);
      const balanceAfter = await usdc.balanceOf(stakingAddress);

      expect(balanceAfter - balanceBefore).to.equal(stakeAmount);
    });
  });

  describe("Unstaking Functions", function () {
    beforeEach(async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);
    });

    it("Should allow users to unstake USDC", async function () {
      const unstakeAmount = ethers.parseUnits("500", 6);

      await expect(staking.connect(user1).unstake(unstakeAmount))
        .to.emit(staking, "Unstaked")
        .withArgs(user1.address, unstakeAmount);

      expect(await staking.stakedBalance(user1.address)).to.equal(
        ethers.parseUnits("500", 6)
      );
    });

    it("Should revert when unstaking zero amount", async function () {
      await expect(
        staking.connect(user1).unstake(0)
      ).to.be.revertedWith("Cannot unstake 0");
    });

    it("Should revert when unstaking more than staked", async function () {
      const unstakeAmount = ethers.parseUnits("2000", 6);

      await expect(
        staking.connect(user1).unstake(unstakeAmount)
      ).to.be.revertedWith("Insufficient staked balance");
    });

    it("Should transfer USDC back to user", async function () {
      const unstakeAmount = ethers.parseUnits("500", 6);
      const balanceBefore = await usdc.balanceOf(user1.address);

      await staking.connect(user1).unstake(unstakeAmount);

      const balanceAfter = await usdc.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(unstakeAmount);
    });

    it("Should allow complete unstake", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);

      await staking.connect(user1).unstake(stakeAmount);

      expect(await staking.stakedBalance(user1.address)).to.equal(0);
      expect(await staking.totalStaked()).to.equal(0);
    });
  });

  describe("Rewards System", function () {
    beforeEach(async function () {
      // Fund reward pool
      const rewardAmount = ethers.parseUnits("10000", 6);
      await usdc.connect(owner).approve(stakingAddress, rewardAmount);
      await staking.fundRewardPool(rewardAmount);

      // Set reward rate
      await staking.setRewardRate(100); // 100 wei per second per USDC
    });

    it("Should calculate rewards correctly", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      // Fast forward 1 hour (3600 seconds)
      await time.increase(3600);

      const earned = await staking.earned(user1.address);

      // Expected reward: stakeAmount * rewardRate * time / 1e18
      // 1000 * 10^6 * 100 * 3600 / 1e18 = 360 USDC (6 decimals)
      expect(earned).to.be.closeTo(ethers.parseUnits("360", 6), ethers.parseUnits("1", 6));
    });

    it("Should allow claiming rewards", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      // Fast forward
      await time.increase(3600);

      const earned = await staking.earned(user1.address);
      const balanceBefore = await usdc.balanceOf(user1.address);

      await expect(staking.connect(user1).claimReward())
        .to.emit(staking, "RewardClaimed")
        .withArgs(user1.address, earned);

      const balanceAfter = await usdc.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.be.closeTo(earned, ethers.parseUnits("0.1", 6));
    });

    it("Should revert when claiming with no rewards", async function () {
      await expect(
        staking.connect(user1).claimReward()
      ).to.be.revertedWith("No rewards to claim");
    });

    it("Should distribute rewards proportionally to multiple stakers", async function () {
      // User1 stakes 1000 USDC
      const stake1 = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stake1);
      await staking.connect(user1).stake(stake1);

      // User2 stakes 3000 USDC
      const stake2 = ethers.parseUnits("3000", 6);
      await usdc.connect(user2).approve(stakingAddress, stake2);
      await staking.connect(user2).stake(stake2);

      // Fast forward
      await time.increase(3600);

      const earned1 = await staking.earned(user1.address);
      const earned2 = await staking.earned(user2.address);

      // User2 should earn 3x more than user1 (3000/1000 = 3)
      expect(earned2 / earned1).to.be.closeTo(3n, 1n);
    });

    it("Should update rewards on stake/unstake", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount * 2n);
      await staking.connect(user1).stake(stakeAmount);

      // Fast forward
      await time.increase(1800);

      const earnedBefore = await staking.earned(user1.address);

      // Stake more
      await staking.connect(user1).stake(stakeAmount);

      // Rewards should be preserved
      const earnedAfter = await staking.earned(user1.address);
      expect(earnedAfter).to.be.gte(earnedBefore);
    });
  });

  describe("Tier System", function () {
    it("Should return correct tier for Bronze (100 USDC)", async function () {
      const stakeAmount = ethers.parseUnits("100", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      const tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Bronze");
      expect(tier.feeDiscountBps).to.equal(1000); // 10%

      const discount = await staking.getFeeDiscount(user1.address);
      expect(discount).to.equal(1000);
    });

    it("Should return correct tier for Silver (500 USDC)", async function () {
      const stakeAmount = ethers.parseUnits("500", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      const tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Silver");
      expect(tier.feeDiscountBps).to.equal(2000); // 20%
    });

    it("Should return correct tier for Gold (2000 USDC)", async function () {
      const stakeAmount = ethers.parseUnits("2000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      const tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Gold");
      expect(tier.feeDiscountBps).to.equal(3500); // 35%
    });

    it("Should return correct tier for Platinum (10000 USDC)", async function () {
      const stakeAmount = ethers.parseUnits("10000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      const tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Platinum");
      expect(tier.feeDiscountBps).to.equal(5000); // 50%
    });

    it("Should return None tier for users below Bronze", async function () {
      const stakeAmount = ethers.parseUnits("50", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      const tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("None");
      expect(tier.feeDiscountBps).to.equal(0);
    });

    it("Should return None tier for users with no stake", async function () {
      const tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("None");
      expect(tier.feeDiscountBps).to.equal(0);

      const discount = await staking.getFeeDiscount(user1.address);
      expect(discount).to.equal(0);
    });

    it("Should upgrade tier when staking more", async function () {
      // Start with Bronze
      const stake1 = ethers.parseUnits("100", 6);
      await usdc.connect(user1).approve(stakingAddress, ethers.parseUnits("1000", 6));
      await staking.connect(user1).stake(stake1);

      let tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Bronze");

      // Upgrade to Silver
      const stake2 = ethers.parseUnits("400", 6);
      await staking.connect(user1).stake(stake2);

      tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Silver");
    });

    it("Should downgrade tier when unstaking", async function () {
      // Start with Silver
      const stakeAmount = ethers.parseUnits("500", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      let tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Silver");

      // Downgrade to Bronze
      const unstakeAmount = ethers.parseUnits("450", 6);
      await staking.connect(user1).unstake(unstakeAmount);

      tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("None");
    });
  });

  describe("Admin Functions", function () {
    describe("Tier Management", function () {
      it("Should allow owner to add new tier", async function () {
        const threshold = ethers.parseUnits("50000", 6);
        const feeDiscountBps = 7500; // 75%
        const name = "Diamond";

        await expect(staking.addTier(threshold, feeDiscountBps, name))
          .to.emit(staking, "TierAdded")
          .withArgs(4, threshold, feeDiscountBps, name);

        const tiersCount = await staking.getTiersCount();
        expect(tiersCount).to.equal(5);

        const tier = await staking.tiers(4);
        expect(tier.threshold).to.equal(threshold);
        expect(tier.feeDiscountBps).to.equal(feeDiscountBps);
        expect(tier.name).to.equal(name);
      });

      it("Should revert adding tier with invalid discount", async function () {
        await expect(
          staking.addTier(ethers.parseUnits("1000", 6), 11000, "Invalid")
        ).to.be.revertedWith("Invalid fee discount");
      });

      it("Should allow owner to update existing tier", async function () {
        const newThreshold = ethers.parseUnits("150", 6);
        const newDiscount = 1500; // 15%

        await expect(staking.updateTier(0, newThreshold, newDiscount))
          .to.emit(staking, "TierUpdated")
          .withArgs(0, newThreshold, newDiscount);

        const tier = await staking.tiers(0);
        expect(tier.threshold).to.equal(newThreshold);
        expect(tier.feeDiscountBps).to.equal(newDiscount);
      });

      it("Should revert updating non-existent tier", async function () {
        await expect(
          staking.updateTier(10, ethers.parseUnits("1000", 6), 1000)
        ).to.be.revertedWith("Invalid tier index");
      });

      it("Should revert tier management from non-owner", async function () {
        await expect(
          staking.connect(user1).addTier(ethers.parseUnits("1000", 6), 1000, "Test")
        ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");

        await expect(
          staking.connect(user1).updateTier(0, ethers.parseUnits("200", 6), 1200)
        ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
      });
    });

    describe("Reward Management", function () {
      it("Should allow owner to set reward rate", async function () {
        const newRate = 500;

        await expect(staking.setRewardRate(newRate))
          .to.emit(staking, "RewardRateUpdated")
          .withArgs(newRate);

        expect(await staking.rewardRate()).to.equal(newRate);
      });

      it("Should revert reward rate update from non-owner", async function () {
        await expect(
          staking.connect(user1).setRewardRate(100)
        ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
      });

      it("Should allow owner to fund reward pool", async function () {
        const fundAmount = ethers.parseUnits("5000", 6);
        await usdc.connect(owner).approve(stakingAddress, fundAmount);

        await expect(staking.fundRewardPool(fundAmount))
          .to.emit(staking, "RewardPoolFunded")
          .withArgs(fundAmount);

        expect(await staking.rewardPool()).to.equal(fundAmount);
      });

      it("Should revert funding with zero amount", async function () {
        await expect(
          staking.fundRewardPool(0)
        ).to.be.revertedWith("Cannot fund 0");
      });
    });

    describe("Emergency Withdraw", function () {
      it("Should allow owner to emergency withdraw", async function () {
        // Fund reward pool
        const fundAmount = ethers.parseUnits("5000", 6);
        await usdc.connect(owner).approve(stakingAddress, fundAmount);
        await staking.fundRewardPool(fundAmount);

        const ownerBalanceBefore = await usdc.balanceOf(owner.address);
        const withdrawAmount = ethers.parseUnits("1000", 6);

        await staking.emergencyWithdraw(withdrawAmount);

        const ownerBalanceAfter = await usdc.balanceOf(owner.address);
        expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(withdrawAmount);
      });

      it("Should not allow withdrawing staked funds", async function () {
        // User stakes
        const stakeAmount = ethers.parseUnits("1000", 6);
        await usdc.connect(user1).approve(stakingAddress, stakeAmount);
        await staking.connect(user1).stake(stakeAmount);

        // Owner tries to withdraw staked amount
        await expect(
          staking.emergencyWithdraw(stakeAmount)
        ).to.be.revertedWith("Cannot withdraw staked funds");
      });

      it("Should revert emergency withdraw from non-owner", async function () {
        await expect(
          staking.connect(user1).emergencyWithdraw(ethers.parseUnits("100", 6))
        ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
      });
    });
  });

  describe("View Functions", function () {
    it("Should return correct stake info", async function () {
      const stakeAmount = ethers.parseUnits("1000", 6);
      await usdc.connect(user1).approve(stakingAddress, stakeAmount);
      await staking.connect(user1).stake(stakeAmount);

      const [amount, stakedAt, rewards, tier] = await staking.getStakeInfo(user1.address);

      expect(amount).to.equal(stakeAmount);
      expect(stakedAt).to.be.gt(0);
      expect(tier.name).to.equal("Silver");
    });

    it("Should return all tiers", async function () {
      const tiers = await staking.getAllTiers();
      expect(tiers.length).to.equal(4);
      expect(tiers[0].name).to.equal("Bronze");
      expect(tiers[1].name).to.equal("Silver");
      expect(tiers[2].name).to.equal("Gold");
      expect(tiers[3].name).to.equal("Platinum");
    });
  });

  describe("Integration Tests", function () {
    it("Should handle complex staking/unstaking scenario", async function () {
      // Setup reward pool
      const rewardAmount = ethers.parseUnits("10000", 6);
      await usdc.connect(owner).approve(stakingAddress, rewardAmount);
      await staking.fundRewardPool(rewardAmount);
      await staking.setRewardRate(100);

      // User1 stakes to Silver tier
      const stake1 = ethers.parseUnits("500", 6);
      await usdc.connect(user1).approve(stakingAddress, stake1 * 3n);
      await staking.connect(user1).stake(stake1);

      let tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Silver");

      // Time passes
      await time.increase(3600);

      // User1 upgrades to Gold
      const stake2 = ethers.parseUnits("1500", 6);
      await staking.connect(user1).stake(stake2);

      tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Gold");

      // User1 has rewards
      const earned = await staking.earned(user1.address);
      expect(earned).to.be.gt(0);

      // User1 claims rewards
      await staking.connect(user1).claimReward();

      // User1 partially unstakes
      await staking.connect(user1).unstake(stake1);

      // Still Gold tier
      tier = await staking.getUserTier(user1.address);
      expect(tier.name).to.equal("Silver");

      // Final balance should be correct
      expect(await staking.stakedBalance(user1.address)).to.equal(stake2);
    });

    it("Should handle multiple users across different tiers", async function () {
      // Fund reward pool
      const rewardAmount = ethers.parseUnits("10000", 6);
      await usdc.connect(owner).approve(stakingAddress, rewardAmount);
      await staking.fundRewardPool(rewardAmount);
      await staking.setRewardRate(100);

      // User1: Bronze
      const stake1 = ethers.parseUnits("100", 6);
      await usdc.connect(user1).approve(stakingAddress, stake1);
      await staking.connect(user1).stake(stake1);

      // User2: Silver
      const stake2 = ethers.parseUnits("500", 6);
      await usdc.connect(user2).approve(stakingAddress, stake2);
      await staking.connect(user2).stake(stake2);

      // User3: Gold
      const stake3 = ethers.parseUnits("2000", 6);
      await usdc.connect(user3).approve(stakingAddress, stake3);
      await staking.connect(user3).stake(stake3);

      // User4: Platinum
      const stake4 = ethers.parseUnits("10000", 6);
      await usdc.connect(user4).approve(stakingAddress, stake4);
      await staking.connect(user4).stake(stake4);

      // Verify tiers
      expect((await staking.getUserTier(user1.address)).name).to.equal("Bronze");
      expect((await staking.getUserTier(user2.address)).name).to.equal("Silver");
      expect((await staking.getUserTier(user3.address)).name).to.equal("Gold");
      expect((await staking.getUserTier(user4.address)).name).to.equal("Platinum");

      // Verify fee discounts
      expect(await staking.getFeeDiscount(user1.address)).to.equal(1000); // 10%
      expect(await staking.getFeeDiscount(user2.address)).to.equal(2000); // 20%
      expect(await staking.getFeeDiscount(user3.address)).to.equal(3500); // 35%
      expect(await staking.getFeeDiscount(user4.address)).to.equal(5000); // 50%

      // Time passes
      await time.increase(3600);

      // All users should have rewards proportional to stake
      const earned1 = await staking.earned(user1.address);
      const earned2 = await staking.earned(user2.address);
      const earned3 = await staking.earned(user3.address);
      const earned4 = await staking.earned(user4.address);

      expect(earned4).to.be.gt(earned3);
      expect(earned3).to.be.gt(earned2);
      expect(earned2).to.be.gt(earned1);
    });
  });
});
