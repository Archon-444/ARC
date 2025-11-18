const hre = require("hardhat");

async function main() {
  console.log("Starting deployment to Arc blockchain...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy MockUSDC (for testnet only)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy ArcMarketNFT
  console.log("\nDeploying ArcMarketNFT...");
  const ArcMarketNFT = await hre.ethers.getContractFactory("ArcMarketNFT");
  const nft = await ArcMarketNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("ArcMarketNFT deployed to:", nftAddress);

  // Deploy ArcStaking
  console.log("\nDeploying ArcStaking...");
  const ArcStaking = await hre.ethers.getContractFactory("ArcStaking");
  const staking = await ArcStaking.deploy(usdcAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("ArcStaking deployed to:", stakingAddress);

  // Deploy ArcMarketplace
  console.log("\nDeploying ArcMarketplace...");
  const ArcMarketplace = await hre.ethers.getContractFactory("ArcMarketplace");
  const marketplace = await ArcMarketplace.deploy(usdcAddress, deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("ArcMarketplace deployed to:", marketplaceAddress);

  // Set staking contract in marketplace
  console.log("\nSetting staking contract in marketplace...");
  await marketplace.setStakingContract(stakingAddress);
  console.log("Staking contract set");

  // Deploy ArcGovernance
  console.log("\nDeploying ArcGovernance...");
  const ArcGovernance = await hre.ethers.getContractFactory("ArcGovernance");
  const governance = await ArcGovernance.deploy(usdcAddress, stakingAddress);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("ArcGovernance deployed to:", governanceAddress);

  // Fund staking reward pool
  console.log("\nFunding staking reward pool...");
  const fundAmount = hre.ethers.parseUnits("100000", 6); // 100k USDC
  await usdc.approve(stakingAddress, fundAmount);
  await staking.fundRewardPool(fundAmount);
  console.log("Staking reward pool funded with 100,000 USDC");

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", hre.network.name);
  console.log("MockUSDC:", usdcAddress);
  console.log("ArcMarketNFT:", nftAddress);
  console.log("ArcStaking:", stakingAddress);
  console.log("ArcMarketplace:", marketplaceAddress);
  console.log("ArcGovernance:", governanceAddress);

  // Save deployment addresses
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDC: usdcAddress,
      ArcMarketNFT: nftAddress,
      ArcStaking: stakingAddress,
      ArcMarketplace: marketplaceAddress,
      ArcGovernance: governanceAddress,
    },
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
