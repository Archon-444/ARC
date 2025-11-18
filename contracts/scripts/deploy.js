const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of ArcMarket v0.2...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy MockUSDC (for testnet only - use real USDC on mainnet)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy FeeVault (needs USDC and marketplace address)
  // We'll deploy FeeVault first with a temp marketplace address, then update it
  console.log("\nDeploying FeeVault...");
  const FeeVault = await hre.ethers.getContractFactory("FeeVault");
  const feeVault = await FeeVault.deploy(usdcAddress, deployer.address); // temp marketplace
  await feeVault.waitForDeployment();
  const feeVaultAddress = await feeVault.getAddress();
  console.log("FeeVault deployed to:", feeVaultAddress);

  // Deploy NFTMarketplace
  console.log("\nDeploying NFTMarketplace...");
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const protocolFeeBps = 250; // 2.5%
  const marketplace = await NFTMarketplace.deploy(
    usdcAddress,
    feeVaultAddress,
    protocolFeeBps
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("NFTMarketplace deployed to:", marketplaceAddress);

  // Update FeeVault with correct marketplace address
  console.log("\nUpdating FeeVault marketplace address...");
  await feeVault.setMarketplace(marketplaceAddress);
  console.log("FeeVault marketplace updated");

  // Deploy ProfileRegistry
  console.log("\nDeploying ProfileRegistry...");
  const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
  const profileRegistry = await ProfileRegistry.deploy();
  await profileRegistry.waitForDeployment();
  const profileRegistryAddress = await profileRegistry.getAddress();
  console.log("ProfileRegistry deployed to:", profileRegistryAddress);

  // Deploy StakingRewards (v0.2)
  console.log("\nDeploying StakingRewards...");
  const StakingRewards = await hre.ethers.getContractFactory("StakingRewards");
  const stakingRewards = await StakingRewards.deploy(usdcAddress);
  await stakingRewards.waitForDeployment();
  const stakingRewardsAddress = await stakingRewards.getAddress();
  console.log("StakingRewards deployed to:", stakingRewardsAddress);
  console.log("  - Default tiers initialized (Bronze, Silver, Gold, Platinum)");
  console.log("  - Initial reward rate: 1 wei per second per USDC");

  // Deploy SimpleGovernance (v0.2)
  console.log("\nDeploying SimpleGovernance...");
  const SimpleGovernance = await hre.ethers.getContractFactory("SimpleGovernance");
  const simpleGovernance = await SimpleGovernance.deploy(usdcAddress, stakingRewardsAddress);
  await simpleGovernance.waitForDeployment();
  const simpleGovernanceAddress = await simpleGovernance.getAddress();
  console.log("SimpleGovernance deployed to:", simpleGovernanceAddress);
  console.log("  - Voting period: 7 days");
  console.log("  - Min stake to propose: 1000 USDC");
  console.log("  - Quorum: 10% of total staked");

  // Optional: Set up initial splits in FeeVault
  console.log("\nSetting up default global splits (platform fee)...");
  const globalSplits = [
    {
      recipient: deployer.address,
      bps: 10000, // 100% to deployer initially
    },
  ];
  await feeVault.setGlobalSplits(globalSplits);
  console.log("Default global splits configured");

  // Summary
  console.log("\n=== ArcMarket v0.2 Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nv0.1 Core Contracts:");
  console.log("  MockUSDC:", usdcAddress);
  console.log("  NFTMarketplace:", marketplaceAddress);
  console.log("  FeeVault:", feeVaultAddress);
  console.log("  ProfileRegistry:", profileRegistryAddress);
  console.log("\nv0.2 Contracts:");
  console.log("  StakingRewards:", stakingRewardsAddress);
  console.log("  SimpleGovernance:", simpleGovernanceAddress);
  console.log("\nConfiguration:");
  console.log("  Protocol Fee:", protocolFeeBps / 100, "%");
  console.log("  Staking Tiers: Bronze (100), Silver (500), Gold (2000), Platinum (10000) USDC");
  console.log("  Governance: 7-day voting, 1000 USDC min to propose");

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    version: "0.2.0",
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockUSDC: usdcAddress,
      NFTMarketplace: marketplaceAddress,
      FeeVault: feeVaultAddress,
      ProfileRegistry: profileRegistryAddress,
      StakingRewards: stakingRewardsAddress,
      SimpleGovernance: simpleGovernanceAddress,
    },
    configuration: {
      protocolFeeBps: protocolFeeBps,
    },
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment.json");

  // Generate .env template for frontend
  const envTemplate = `
# ArcMarket v0.2 Contract Addresses
VITE_CHAIN_ID=${hre.network.config.chainId || 31337}
VITE_RPC_URL=${hre.network.config.url || "http://localhost:8545"}
VITE_USDC_ADDRESS=${usdcAddress}
VITE_MARKETPLACE_ADDRESS=${marketplaceAddress}
VITE_FEEVAULT_ADDRESS=${feeVaultAddress}
VITE_PROFILEREGISTRY_ADDRESS=${profileRegistryAddress}
VITE_STAKINGREWARDS_ADDRESS=${stakingRewardsAddress}
VITE_SIMPLEGOVERNANCE_ADDRESS=${simpleGovernanceAddress}
VITE_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/arcmarket
`;

  fs.writeFileSync(".env.deployed", envTemplate.trim());
  console.log("Environment template saved to .env.deployed");
  console.log("\nCopy .env.deployed to your frontend .env file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
