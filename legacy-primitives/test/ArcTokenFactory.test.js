const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArcTokenFactory + ArcBondingCurveAMM", function () {
  let usdc, staking, factory;
  let owner, creator, buyer, seller, staker;
  let feeVault;

  // Default token creation params
  const TOKEN_NAME = "TestToken";
  const TOKEN_SYMBOL = "TT";
  const TOKEN_DESCRIPTION = "A test token";
  const TOKEN_IMAGE = "https://example.com/image.png";
  const TOTAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens (18 decimals)
  const BASE_PRICE = 10000n; // 0.01 USDC (6 decimals)
  const SLOPE = ethers.parseEther("1"); // 1 (scaled to 1e18)
  const CURVE_TYPE_LINEAR = 0;
  const CURVE_TYPE_EXPONENTIAL = 1;

  // USDC amounts
  const USDC = (amount) => ethers.parseUnits(amount.toString(), 6);
  const CREATION_FEE = USDC(25); // $25 USDC

  beforeEach(async function () {
    [owner, creator, buyer, seller, staker, feeVault] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    // Deploy StakingRewards
    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    staking = await StakingRewards.deploy(await usdc.getAddress());
    await staking.waitForDeployment();

    // Deploy ArcTokenFactory
    const ArcTokenFactory = await ethers.getContractFactory("ArcTokenFactory");
    factory = await ArcTokenFactory.deploy(
      await usdc.getAddress(),
      await staking.getAddress(),
      feeVault.address
    );
    await factory.waitForDeployment();

    // Distribute USDC to test accounts
    await usdc.transfer(creator.address, USDC(100000));
    await usdc.transfer(buyer.address, USDC(100000));
    await usdc.transfer(seller.address, USDC(100000));
    await usdc.transfer(staker.address, USDC(100000));
  });

  // Helper: create a token and return addresses
  async function createToken(signer = creator, overrides = {}) {
    const factoryAddr = await factory.getAddress();
    const fee = overrides.fee || CREATION_FEE;
    await usdc.connect(signer).approve(factoryAddr, fee);

    const tx = await factory.connect(signer).createToken(
      overrides.name || TOKEN_NAME,
      overrides.symbol || TOKEN_SYMBOL,
      overrides.description || TOKEN_DESCRIPTION,
      overrides.imageUrl || TOKEN_IMAGE,
      overrides.totalSupply || TOTAL_SUPPLY,
      overrides.basePrice || BASE_PRICE,
      overrides.slope || SLOPE,
      overrides.curveType ?? CURVE_TYPE_LINEAR
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => {
        try {
          return factory.interface.parseLog(log)?.name === "TokenCreated";
        } catch { return false; }
      }
    );
    const parsed = factory.interface.parseLog(event);

    return {
      tokenAddress: parsed.args.tokenAddress,
      ammAddress: parsed.args.ammAddress,
      token: await ethers.getContractAt("ArcToken", parsed.args.tokenAddress),
      amm: await ethers.getContractAt("ArcBondingCurveAMM", parsed.args.ammAddress),
    };
  }

  // Helper: buy tokens on AMM
  async function buyTokens(amm, signer, usdcAmount, minTokensOut = 0) {
    const ammAddr = await amm.getAddress();
    await usdc.connect(signer).approve(ammAddr, usdcAmount);
    return amm.connect(signer).buyTokens(usdcAmount, minTokensOut);
  }

  // ================================================================
  // SUITE 1: Decimal Precision
  // ================================================================
  describe("Suite 1: Decimal Precision (USDC 6-decimal)", function () {
    it("should return non-zero tokens for $1 USDC buy", async function () {
      const { amm, token } = await createToken();
      const oneUSDC = USDC(1);

      await buyTokens(amm, buyer, oneUSDC);

      const balance = await token.balanceOf(buyer.address);
      expect(balance).to.be.gt(0, "Should receive tokens for $1 USDC");
    });

    it("should return non-zero tokens for $0.01 USDC buy (no truncation)", async function () {
      const { amm, token } = await createToken();
      const oneCent = USDC("0.01");

      await buyTokens(amm, buyer, oneCent);

      const balance = await token.balanceOf(buyer.address);
      expect(balance).to.be.gt(0, "Small buy should not truncate to zero");
    });

    it("should handle large buy ($10,000 USDC) without overflow", async function () {
      const { amm, token } = await createToken();
      const tenK = USDC(10000);

      await buyTokens(amm, buyer, tenK);

      const balance = await token.balanceOf(buyer.address);
      expect(balance).to.be.gt(0);
    });

    it("should maintain price consistency across buy/sell", async function () {
      const { amm, token } = await createToken();
      const buyAmount = USDC(100);

      // Buy tokens
      await buyTokens(amm, buyer, buyAmount);
      const tokensReceived = await token.balanceOf(buyer.address);

      // Check sell return is less than buy (due to fees)
      const [sellReturn] = await amm.calculateSellReturn(tokensReceived);
      // Sell return should be close to buy amount minus 2x fees (buy + sell)
      expect(sellReturn).to.be.gt(0);
      expect(sellReturn).to.be.lt(buyAmount); // Less due to fees
    });

    it("should increase price after each buy (linear curve)", async function () {
      const { amm } = await createToken();

      const priceBefore = await amm.getCurrentPrice();
      await buyTokens(amm, buyer, USDC(100));
      const priceAfter = await amm.getCurrentPrice();

      expect(priceAfter).to.be.gt(priceBefore, "Price should increase after buy");
    });

    it("getCurrentPrice should return basePrice at zero supply", async function () {
      const { amm } = await createToken();
      const price = await amm.getCurrentPrice();
      expect(price).to.equal(BASE_PRICE);
    });
  });

  // ================================================================
  // SUITE 2: USDC Approval Flow
  // ================================================================
  describe("Suite 2: USDC Approval Flow", function () {
    it("should revert buyTokens without USDC approval", async function () {
      const { amm } = await createToken();
      // No approval
      await expect(
        amm.connect(buyer).buyTokens(USDC(100), 0)
      ).to.be.reverted;
    });

    it("should succeed buyTokens after USDC approval", async function () {
      const { amm } = await createToken();
      const ammAddr = await amm.getAddress();
      await usdc.connect(buyer).approve(ammAddr, USDC(100));

      await expect(
        amm.connect(buyer).buyTokens(USDC(100), 0)
      ).to.not.be.reverted;
    });

    it("should revert createToken without USDC approval", async function () {
      await expect(
        factory.connect(creator).createToken(
          "NoApproval", "NA", "", "", TOTAL_SUPPLY, BASE_PRICE, SLOPE, CURVE_TYPE_LINEAR
        )
      ).to.be.reverted;
    });

    it("should revert sellTokens without token approval", async function () {
      const { amm, token } = await createToken();

      // Buy some tokens first
      await buyTokens(amm, buyer, USDC(100));
      const balance = await token.balanceOf(buyer.address);

      // Try to sell without token approval
      await expect(
        amm.connect(buyer).sellTokens(balance, 0)
      ).to.be.reverted;
    });

    it("should revert ArcToken approve with zero-address spender", async function () {
      const { token } = await createToken();
      await expect(
        token.connect(buyer).approve(ethers.ZeroAddress, USDC(100))
      ).to.be.revertedWithCustomError(token, "ZeroAddress");
    });

    it("should succeed sellTokens after token approval", async function () {
      const { amm, token } = await createToken();

      // Buy some tokens
      await buyTokens(amm, buyer, USDC(100));
      const balance = await token.balanceOf(buyer.address);

      // Approve and sell
      const ammAddr = await amm.getAddress();
      await token.connect(buyer).approve(ammAddr, balance);
      await expect(
        amm.connect(buyer).sellTokens(balance, 0)
      ).to.not.be.reverted;
    });
  });

  // ================================================================
  // SUITE 3: Token Factory
  // ================================================================
  describe("Suite 3: Token Factory", function () {
    it("should create token with valid params and emit TokenCreated", async function () {
      const factoryAddr = await factory.getAddress();
      await usdc.connect(creator).approve(factoryAddr, CREATION_FEE);

      await expect(
        factory.connect(creator).createToken(
          TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DESCRIPTION, TOKEN_IMAGE,
          TOTAL_SUPPLY, BASE_PRICE, SLOPE, CURVE_TYPE_LINEAR
        )
      ).to.emit(factory, "TokenCreated");
    });

    it("should charge $25 USDC creation fee", async function () {
      const feeVaultBefore = await usdc.balanceOf(feeVault.address);

      await createToken();

      const feeVaultAfter = await usdc.balanceOf(feeVault.address);
      expect(feeVaultAfter - feeVaultBefore).to.equal(CREATION_FEE);
    });

    it("should apply staker discount (Bronze tier = 10%)", async function () {
      // Stake 100 USDC for Bronze tier
      const stakingAddr = await staking.getAddress();
      await usdc.connect(creator).approve(stakingAddr, USDC(100));
      await staking.connect(creator).stake(USDC(100));

      const feeVaultBefore = await usdc.balanceOf(feeVault.address);

      // Create token with discount
      const factoryAddr = await factory.getAddress();
      await usdc.connect(creator).approve(factoryAddr, CREATION_FEE);
      await factory.connect(creator).createToken(
        TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DESCRIPTION, TOKEN_IMAGE,
        TOTAL_SUPPLY, BASE_PRICE, SLOPE, CURVE_TYPE_LINEAR
      );

      const feeVaultAfter = await usdc.balanceOf(feeVault.address);
      const actualFee = feeVaultAfter - feeVaultBefore;

      // Bronze = 1000 bps (10%) discount → $25 * 0.9 = $22.50
      const expectedFee = USDC(25) - (USDC(25) * 1000n / 10000n);
      expect(actualFee).to.equal(expectedFee);
    });

    it("should enforce rate limiting (60s cooldown)", async function () {
      await createToken();

      // Second creation within 60s should revert
      const factoryAddr = await factory.getAddress();
      await usdc.connect(creator).approve(factoryAddr, CREATION_FEE);
      await expect(
        factory.connect(creator).createToken(
          "Token2", "T2", "", "", TOTAL_SUPPLY, BASE_PRICE, SLOPE, CURVE_TYPE_LINEAR
        )
      ).to.be.revertedWithCustomError(factory, "RateLimitExceeded");

      // After 60s should succeed
      await time.increase(61);
      await usdc.connect(creator).approve(factoryAddr, CREATION_FEE);
      await expect(
        factory.connect(creator).createToken(
          "Token2", "T2", "", "", TOTAL_SUPPLY, BASE_PRICE, SLOPE, CURVE_TYPE_LINEAR
        )
      ).to.not.be.reverted;
    });

    it("should revert on invalid params", async function () {
      const factoryAddr = await factory.getAddress();
      await usdc.connect(creator).approve(factoryAddr, CREATION_FEE);

      // Empty name
      await expect(
        factory.connect(creator).createToken(
          "", TOKEN_SYMBOL, "", "", TOTAL_SUPPLY, BASE_PRICE, SLOPE, CURVE_TYPE_LINEAR
        )
      ).to.be.revertedWithCustomError(factory, "InvalidInput");

      // Zero base price
      await expect(
        factory.connect(creator).createToken(
          TOKEN_NAME, TOKEN_SYMBOL, "", "", TOTAL_SUPPLY, 0, SLOPE, CURVE_TYPE_LINEAR
        )
      ).to.be.revertedWithCustomError(factory, "InvalidInput");

      // Supply too low
      await expect(
        factory.connect(creator).createToken(
          TOKEN_NAME, TOKEN_SYMBOL, "", "", 0, BASE_PRICE, SLOPE, CURVE_TYPE_LINEAR
        )
      ).to.be.revertedWithCustomError(factory, "InvalidInput");
    });

    it("should transfer entire supply to AMM", async function () {
      const { token, amm } = await createToken();
      const ammAddr = await amm.getAddress();
      const ammBalance = await token.balanceOf(ammAddr);
      expect(ammBalance).to.equal(TOTAL_SUPPLY);
    });

    it("should track all created tokens", async function () {
      await createToken();
      await time.increase(61);
      await createToken(creator, { name: "Token2", symbol: "T2" });

      expect(await factory.getTotalTokens()).to.equal(2);
      const allTokens = await factory.getAllTokens();
      expect(allTokens.length).to.equal(2);
    });

    it("should increment creator nonce for deterministic CREATE2", async function () {
      expect(await factory.creatorNonce(creator.address)).to.equal(0);

      await createToken();
      expect(await factory.creatorNonce(creator.address)).to.equal(1);

      await time.increase(61);
      await createToken(creator, { name: "Token2", symbol: "T2" });
      expect(await factory.creatorNonce(creator.address)).to.equal(2);
    });

    it("should store token config correctly", async function () {
      const { tokenAddress } = await createToken();

      const config = await factory.getTokenConfig(tokenAddress);
      expect(config.name).to.equal(TOKEN_NAME);
      expect(config.symbol).to.equal(TOKEN_SYMBOL);
      expect(config.totalSupply).to.equal(TOTAL_SUPPLY);
      expect(config.creator).to.equal(creator.address);
    });
  });

  // ================================================================
  // SUITE 4: Bonding Curve Buy/Sell
  // ================================================================
  describe("Suite 4: Bonding Curve Buy/Sell", function () {
    it("should increase price on buy (linear)", async function () {
      const { amm } = await createToken();

      const price1 = await amm.getCurrentPrice();
      await buyTokens(amm, buyer, USDC(1000));
      const price2 = await amm.getCurrentPrice();
      await buyTokens(amm, buyer, USDC(1000));
      const price3 = await amm.getCurrentPrice();

      expect(price2).to.be.gt(price1);
      expect(price3).to.be.gt(price2);
    });

    it("should decrease price on sell", async function () {
      const { amm, token } = await createToken();

      // Buy first
      await buyTokens(amm, buyer, USDC(1000));
      const priceAfterBuy = await amm.getCurrentPrice();
      const tokenBalance = await token.balanceOf(buyer.address);

      // Sell half
      const sellAmount = tokenBalance / 2n;
      const ammAddr = await amm.getAddress();
      await token.connect(buyer).approve(ammAddr, sellAmount);
      await amm.connect(buyer).sellTokens(sellAmount, 0);

      const priceAfterSell = await amm.getCurrentPrice();
      expect(priceAfterSell).to.be.lt(priceAfterBuy);
    });

    it("should enforce slippage protection (minTokensOut)", async function () {
      const { amm } = await createToken();
      const ammAddr = await amm.getAddress();

      await usdc.connect(buyer).approve(ammAddr, USDC(100));

      // Set unreasonably high minTokensOut
      const impossibleMin = ethers.parseEther("999999999");
      await expect(
        amm.connect(buyer).buyTokens(USDC(100), impossibleMin)
      ).to.be.revertedWithCustomError(amm, "SlippageTooHigh");
    });

    it("should deduct 2.5% platform fee and send to feeVault", async function () {
      const { amm } = await createToken();

      const vaultBefore = await usdc.balanceOf(feeVault.address);
      await buyTokens(amm, buyer, USDC(1000));
      const vaultAfter = await usdc.balanceOf(feeVault.address);

      // 2.5% of 1000 USDC = 25 USDC
      const feeCollected = vaultAfter - vaultBefore;
      expect(feeCollected).to.equal(USDC(25));
    });

    it("should revert buy with zero amount", async function () {
      const { amm } = await createToken();
      const ammAddr = await amm.getAddress();
      await usdc.connect(buyer).approve(ammAddr, USDC(100));

      await expect(
        amm.connect(buyer).buyTokens(0, 0)
      ).to.be.revertedWithCustomError(amm, "InvalidAmount");
    });

    it("should revert sell with zero amount", async function () {
      const { amm } = await createToken();
      await expect(
        amm.connect(buyer).sellTokens(0, 0)
      ).to.be.revertedWithCustomError(amm, "InvalidAmount");
    });

    it("should work with exponential curve type", async function () {
      const { amm, token } = await createToken(creator, {
        curveType: CURVE_TYPE_EXPONENTIAL,
      });

      await buyTokens(amm, buyer, USDC(100));
      const balance = await token.balanceOf(buyer.address);
      expect(balance).to.be.gt(0);

      const price = await amm.getCurrentPrice();
      expect(price).to.be.gt(BASE_PRICE); // Price should have increased
    });

    it("should track total volume", async function () {
      const { amm } = await createToken();
      expect(await amm.totalVolume()).to.equal(0);

      await buyTokens(amm, buyer, USDC(100));
      expect(await amm.totalVolume()).to.equal(USDC(100));
    });

    it("should calculate buy and sell returns via view functions", async function () {
      const { amm } = await createToken();

      const [tokensOut, buyFee] = await amm.calculateBuyReturn(USDC(100));
      expect(tokensOut).to.be.gt(0);
      expect(buyFee).to.equal(USDC("2.5")); // 2.5% of 100

      // Buy tokens then check sell return
      await buyTokens(amm, buyer, USDC(100));
      const supply = await amm.currentSupply();

      const [usdcOut, sellFee] = await amm.calculateSellReturn(supply);
      expect(usdcOut).to.be.gt(0);
      expect(sellFee).to.be.gt(0);
    });
  });

  // ================================================================
  // SUITE 5: Graduation
  // ================================================================
  describe("Suite 5: Graduation", function () {
    // Create token with small supply and low graduation threshold for easy testing
    const SMALL_SUPPLY = ethers.parseEther("1000");  // 1000 tokens
    const LOW_BASE_PRICE = 100n;                      // 0.0001 USDC per token

    async function createSmallToken() {
      return createToken(creator, {
        totalSupply: SMALL_SUPPLY,
        basePrice: LOW_BASE_PRICE,
        slope: 100n, // Low slope
      });
    }

    it("should graduate when 80% supply is sold", async function () {
      const { amm } = await createSmallToken();
      expect(await amm.isGraduated()).to.be.false;

      // Buy until graduation (80% of supply)
      // Use large USDC amount to ensure we hit threshold
      await buyTokens(amm, buyer, USDC(10000));

      expect(await amm.isGraduated()).to.be.true;
    });

    it("should emit TokenGraduated event", async function () {
      const { amm } = await createSmallToken();
      const ammAddr = await amm.getAddress();
      await usdc.connect(buyer).approve(ammAddr, USDC(10000));

      await expect(
        amm.connect(buyer).buyTokens(USDC(10000), 0)
      ).to.emit(amm, "TokenGraduated");
    });

    it("should split USDC 50/25/25 at graduation", async function () {
      const { amm } = await createSmallToken();

      const vaultBefore = await usdc.balanceOf(feeVault.address);
      await buyTokens(amm, buyer, USDC(10000));

      const reserves = await amm.reserves();
      expect(reserves.creatorReserve).to.be.gt(0);
      expect(reserves.stakingRewardPool).to.be.gt(0);
      expect(reserves.platformFee).to.be.gt(0);

      // Platform fee should have been transferred to feeVault
      const vaultAfter = await usdc.balanceOf(feeVault.address);
      expect(vaultAfter - vaultBefore).to.be.gt(0);
    });

    it("should disable buy/sell after graduation", async function () {
      const { amm } = await createSmallToken();

      // Graduate
      await buyTokens(amm, buyer, USDC(10000));
      expect(await amm.isGraduated()).to.be.true;

      // Try to buy again
      const ammAddr = await amm.getAddress();
      await usdc.connect(buyer).approve(ammAddr, USDC(100));
      await expect(
        amm.connect(buyer).buyTokens(USDC(100), 0)
      ).to.be.revertedWithCustomError(amm, "AlreadyGraduated");
    });

    it("should allow creator to withdraw reserve after graduation", async function () {
      const { amm } = await createSmallToken();

      // Graduate
      await buyTokens(amm, buyer, USDC(10000));
      const reserveBalance = (await amm.reserves()).creatorReserve;

      const creatorBefore = await usdc.balanceOf(creator.address);
      await amm.connect(creator).withdrawCreatorReserve(reserveBalance, "development");
      const creatorAfter = await usdc.balanceOf(creator.address);

      expect(creatorAfter - creatorBefore).to.equal(reserveBalance);
    });

    it("should not allow non-creator to withdraw reserve", async function () {
      const { amm } = await createSmallToken();
      await buyTokens(amm, buyer, USDC(10000));

      await expect(
        amm.connect(buyer).withdrawCreatorReserve(1, "steal")
      ).to.be.revertedWithCustomError(amm, "NotCreator");
    });

    it("should allow staking tokens for rewards after graduation", async function () {
      const { amm, token } = await createSmallToken();

      // Graduate by buying
      await buyTokens(amm, buyer, USDC(10000));
      expect(await amm.isGraduated()).to.be.true;

      // Buyer stakes their tokens
      const tokenBalance = await token.balanceOf(buyer.address);
      const ammAddr = await amm.getAddress();
      await token.connect(buyer).approve(ammAddr, tokenBalance);
      await amm.connect(buyer).stakeTokens(tokenBalance);

      expect(await amm.tokenStaked(buyer.address)).to.equal(tokenBalance);
      expect(await amm.totalTokenStaked()).to.equal(tokenBalance);
    });

    it("should accrue staking rewards over time", async function () {
      const { amm, token } = await createSmallToken();

      // Graduate
      await buyTokens(amm, buyer, USDC(10000));

      // Stake tokens
      const tokenBalance = await token.balanceOf(buyer.address);
      const ammAddr = await amm.getAddress();
      await token.connect(buyer).approve(ammAddr, tokenBalance);
      await amm.connect(buyer).stakeTokens(tokenBalance);

      // Fast-forward 30 days
      await time.increase(30 * 24 * 60 * 60);

      const claimable = await amm.getClaimableRewards(buyer.address);
      expect(claimable).to.be.gt(0, "Should have claimable rewards after 30 days");
    });

    it("should report graduation progress correctly", async function () {
      const { amm } = await createSmallToken();

      const progressBefore = await amm.getGraduationProgress();
      expect(progressBefore).to.equal(0);

      await buyTokens(amm, buyer, USDC(10000));

      const progressAfter = await amm.getGraduationProgress();
      expect(progressAfter).to.equal(10000); // 100%
    });
  });

  // ================================================================
  // SUITE 6: Security
  // ================================================================
  describe("Suite 6: Security", function () {
    it("should allow owner to pause factory", async function () {
      await factory.pause();

      const factoryAddr = await factory.getAddress();
      await usdc.connect(creator).approve(factoryAddr, CREATION_FEE);
      await expect(
        factory.connect(creator).createToken(
          TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DESCRIPTION, TOKEN_IMAGE,
          TOTAL_SUPPLY, BASE_PRICE, SLOPE, CURVE_TYPE_LINEAR
        )
      ).to.be.reverted;
    });

    it("should allow owner to unpause factory", async function () {
      await factory.pause();
      await factory.unpause();

      // Should work again
      await expect(createToken()).to.not.be.reverted;
    });

    it("should prevent non-owner from pausing", async function () {
      await expect(
        factory.connect(creator).pause()
      ).to.be.reverted;
    });

    it("should allow owner to update feeVault", async function () {
      await expect(
        factory.updateFeeVault(buyer.address)
      ).to.emit(factory, "FeeVaultUpdated");
    });

    it("should prevent setting zero address as feeVault", async function () {
      await expect(
        factory.updateFeeVault(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(factory, "ZeroAddress");
    });

    it("should allow owner to update staking contract", async function () {
      await expect(
        factory.updateStakingContract(buyer.address)
      ).to.emit(factory, "StakingContractUpdated");
    });

    it("should revert AMM constructor with zero addresses", async function () {
      const ArcBondingCurveAMM = await ethers.getContractFactory("ArcBondingCurveAMM");

      await expect(
        ArcBondingCurveAMM.deploy(
          ethers.ZeroAddress, // token
          creator.address,
          BASE_PRICE,
          SLOPE,
          CURVE_TYPE_LINEAR,
          TOTAL_SUPPLY,
          feeVault.address,
          await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(ArcBondingCurveAMM, "ZeroAddress");
    });

    it("should revert AMM with invalid curve type", async function () {
      const ArcBondingCurveAMM = await ethers.getContractFactory("ArcBondingCurveAMM");

      await expect(
        ArcBondingCurveAMM.deploy(
          creator.address, // dummy token
          creator.address,
          BASE_PRICE,
          SLOPE,
          2, // invalid curve type
          TOTAL_SUPPLY,
          feeVault.address,
          await usdc.getAddress()
        )
      ).to.be.revertedWithCustomError(ArcBondingCurveAMM, "InvalidCurveType");
    });

    it("should not allow staking before graduation", async function () {
      const { amm, token } = await createToken();
      await buyTokens(amm, buyer, USDC(100));

      const balance = await token.balanceOf(buyer.address);
      const ammAddr = await amm.getAddress();
      await token.connect(buyer).approve(ammAddr, balance);

      await expect(
        amm.connect(buyer).stakeTokens(balance)
      ).to.be.revertedWithCustomError(amm, "NotGraduated");
    });

    it("should not allow creator withdraw before graduation", async function () {
      const { amm } = await createToken();
      await expect(
        amm.connect(creator).withdrawCreatorReserve(1, "early")
      ).to.be.revertedWithCustomError(amm, "NotGraduated");
    });
  });
});
