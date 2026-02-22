const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ArcMarket v0.2 to Arc Blockchain...\n");

  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  console.log("━".repeat(60));
  console.log("Network:", network);
  console.log("Chain ID:", chainId);
  console.log("Deployer address:", deployer.address);
  console.log("━".repeat(60));

  // CRITICAL: On Arc, gas is paid in USDC (6 decimals), NOT ETH!
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("\n💰 USDC balance (for gas):", hre.ethers.formatUnits(balance, 6), "USDC");

  if (balance === 0n) {
    console.error("\n❌ ERROR: No USDC for gas!");
    console.error("Visit Arc faucet: https://faucet.circle.com");
    console.error("You need USDC to pay for gas on Arc blockchain\n");
    process.exit(1);
  }

  // Get USDC payment token address from environment
  const usdcAddress = process.env.USDC_ADDRESS_TESTNET || process.env.USDC_ADDRESS_MAINNET;

  if (!usdcAddress || usdcAddress === "0x...") {
    console.error("\n❌ ERROR: USDC_ADDRESS_TESTNET not set in .env");
    console.error("Get the official USDC contract address from:");
    console.error("- https://faucet.circle.com (documentation)");
    console.error("- Circle's Arc documentation");
    console.error("- Or deploy MockUSDC for testing\n");
    process.exit(1);
  }

  console.log("Using USDC (payment token) at:", usdcAddress);

  // Verify USDC contract exists
  try {
    const code = await hre.ethers.provider.getCode(usdcAddress);
    if (code === "0x") {
      console.error("\n❌ ERROR: No contract found at USDC address!");
      console.error("Double-check the USDC address in your .env file\n");
      process.exit(1);
    }
    console.log("✅ USDC contract verified\n");
  } catch (error) {
    console.error("❌ Failed to verify USDC contract:", error.message);
    process.exit(1);
  }

  // Get deployment block for subgraph
  const startBlock = await hre.ethers.provider.getBlockNumber();
  console.log("📦 Starting block number:", startBlock, "\n");

  // ========================================
  // Deploy FeeVault
  // ========================================
  console.log("📄 [1/5] Deploying FeeVault...");
  const FeeVault = await hre.ethers.getContractFactory("FeeVault");
  const feeVault = await FeeVault.deploy(usdcAddress, deployer.address); // temp marketplace
  await feeVault.waitForDeployment();
  const feeVaultAddress = await feeVault.getAddress();
  console.log("✅ FeeVault deployed to:", feeVaultAddress);

  // ========================================
  // Deploy ArcMarketplace
  // ========================================
  console.log("\n📄 [2/5] Deploying ArcMarketplace...");
  const ArcMarketplace = await hre.ethers.getContractFactory("ArcMarketplace");
  const marketplace = await ArcMarketplace.deploy(
    usdcAddress,
    feeVaultAddress // feeRecipient — fees flow to FeeVault
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ ArcMarketplace deployed to:", marketplaceAddress);
  console.log("   Platform Fee: 2.5% (default)");

  // Update FeeVault with correct marketplace address
  console.log("\n🔧 Updating FeeVault with marketplace address...");
  const tx = await feeVault.setMarketplace(marketplaceAddress);
  await tx.wait();
  console.log("✅ FeeVault marketplace updated");

  // ========================================
  // Deploy ProfileRegistry
  // ========================================
  console.log("\n📄 [3/5] Deploying ProfileRegistry...");
  const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
  const profileRegistry = await ProfileRegistry.deploy();
  await profileRegistry.waitForDeployment();
  const profileRegistryAddress = await profileRegistry.getAddress();
  console.log("✅ ProfileRegistry deployed to:", profileRegistryAddress);

  // ========================================
  // Deploy StakingRewards (v0.2)
  // ========================================
  console.log("\n📄 [4/5] Deploying StakingRewards...");
  const StakingRewards = await hre.ethers.getContractFactory("StakingRewards");
  const stakingRewards = await StakingRewards.deploy(usdcAddress);
  await stakingRewards.waitForDeployment();
  const stakingRewardsAddress = await stakingRewards.getAddress();
  console.log("✅ StakingRewards deployed to:", stakingRewardsAddress);
  console.log("   Default tiers: Bronze (100), Silver (500), Gold (2000), Platinum (10000) USDC");
  console.log("   Initial reward rate: 1 wei per second per USDC");

  // ========================================
  // Deploy SimpleGovernance (v0.2)
  // ========================================
  console.log("\n📄 [5/5] Deploying SimpleGovernance...");
  const SimpleGovernance = await hre.ethers.getContractFactory("SimpleGovernance");
  const simpleGovernance = await SimpleGovernance.deploy(usdcAddress, stakingRewardsAddress);
  await simpleGovernance.waitForDeployment();
  const simpleGovernanceAddress = await simpleGovernance.getAddress();
  console.log("✅ SimpleGovernance deployed to:", simpleGovernanceAddress);
  console.log("   Voting period: 7 days");
  console.log("   Min stake to propose: 1000 USDC");
  console.log("   Quorum: 10% of total staked");

  // ========================================
  // Link ArcMarketplace ↔ StakingRewards
  // ========================================
  console.log("\n🔧 Setting staking contract on ArcMarketplace...");
  const stakingTx = await marketplace.setStakingContract(stakingRewardsAddress);
  await stakingTx.wait();
  console.log("✅ Staking contract linked for fee discounts");

  // ========================================
  // Configure FeeVault with default splits
  // ========================================
  console.log("\n🔧 Setting up default global splits (platform fee)...");
  const globalSplits = [
    {
      recipient: deployer.address,
      bps: 10000, // 100% to deployer initially
    },
  ];
  const splitTx = await feeVault.setGlobalSplits(globalSplits);
  await splitTx.wait();
  console.log("✅ Default global splits configured");

  // ========================================
  // Save deployment info
  // ========================================
  const endBlock = await hre.ethers.provider.getBlockNumber();

  const blockExplorerUrl = chainId === 5042002n
    ? "https://testnet.arcscan.app"
    : chainId === 999999n
    ? "https://arcscan.app"
    : "https://testnet.arcscan.app";

  const deployment = {
    version: "0.2.0",
    network: network,
    chainId: Number(chainId),
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    deploymentBlock: startBlock,
    finalBlock: endBlock,
    blockExplorer: blockExplorerUrl,
    contracts: {
      USDC: usdcAddress,
      FeeVault: feeVaultAddress,
      ArcMarketplace: marketplaceAddress,
      ProfileRegistry: profileRegistryAddress,
      StakingRewards: stakingRewardsAddress,
      SimpleGovernance: simpleGovernanceAddress,
    },
    configuration: {
      protocolFeeBps: protocolFeeBps,
      gasToken: "USDC (6 decimals)",
      finality: "100-350ms",
    },
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save with timestamp
  const timestamp = Date.now();
  const filename = `${network}-${timestamp}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));

  // Also save as "latest"
  const latestPath = path.join(deploymentsDir, `${network}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deployment, null, 2));

  console.log("\n💾 Deployment info saved to:");
  console.log("   -", filepath);
  console.log("   -", latestPath);

  // ========================================
  // Generate frontend .env.local
  // ========================================
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
  const frontendEnv = `# Auto-generated from Arc deployment on ${new Date().toISOString()}
# Network: ${network} (Chain ID: ${chainId})
# Deployer: ${deployer.address}

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=${chainId}
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_WS_URL=wss://rpc.testnet.arc.network
NEXT_PUBLIC_BLOCK_EXPLORER=${blockExplorerUrl}

# Contract Addresses
NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}
NEXT_PUBLIC_FEE_VAULT_ADDRESS=${feeVaultAddress}
NEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}
NEXT_PUBLIC_PROFILE_REGISTRY_ADDRESS=${profileRegistryAddress}
NEXT_PUBLIC_STAKING_ADDRESS=${stakingRewardsAddress}
NEXT_PUBLIC_GOVERNANCE_ADDRESS=${simpleGovernanceAddress}

# Subgraph (update after subgraph deployment)
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/arcmarket/v0.1.0

# Circle Wallet (get from https://console.circle.com/)
NEXT_PUBLIC_CIRCLE_APP_ID=your_app_id_here

# WalletConnect (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Deployment Info
NEXT_PUBLIC_DEPLOYMENT_BLOCK=${startBlock}
`;

  fs.writeFileSync(frontendEnvPath, frontendEnv);
  console.log("\n🎨 Frontend .env.local generated at:");
  console.log("   -", frontendEnvPath);

  // ========================================
  // Deployment Summary
  // ========================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ ArcMarket v0.2 Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\n📊 Deployment Summary:");
  console.log("━".repeat(60));
  console.log(`Network:          ${network}`);
  console.log(`Chain ID:         ${chainId}`);
  console.log(`Deployer:         ${deployer.address}`);
  console.log(`Start Block:      ${startBlock}`);
  console.log(`End Block:        ${endBlock}`);
  console.log("━".repeat(60));
  console.log("\n📜 Core Contracts:");
  console.log(`   USDC:              ${usdcAddress}`);
  console.log(`   FeeVault:          ${feeVaultAddress}`);
  console.log(`   ArcMarketplace:    ${marketplaceAddress}`);
  console.log(`   ProfileRegistry:   ${profileRegistryAddress}`);
  console.log("\n📜 v0.2 Contracts:");
  console.log(`   StakingRewards:    ${stakingRewardsAddress}`);
  console.log(`   SimpleGovernance:  ${simpleGovernanceAddress}`);
  console.log("━".repeat(60));
  console.log("\n🔍 View on Arc Explorer:");
  console.log(`   ${blockExplorerUrl}/address/${marketplaceAddress}`);
  console.log("\n📝 Next Steps:");
  console.log("   1. Update subgraph/subgraph.yaml with contract addresses");
  console.log("   2. Deploy subgraph: cd subgraph && npm run deploy");
  console.log("   3. Update NEXT_PUBLIC_SUBGRAPH_URL in frontend/.env.local");
  console.log("   4. Test frontend: cd frontend && npm run dev");
  console.log("   5. Verify contracts (optional): npm run verify:arc-testnet");
  console.log("━".repeat(60));
  console.log("\n🎉 Ready to launch ArcMarket on Circle Arc!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
