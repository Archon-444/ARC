#!/usr/bin/env node

/**
 * Update subgraph.yaml with deployed contract addresses
 *
 * Usage:
 *   node scripts/update-config.js
 *
 * This script reads the latest deployment JSON from contracts/deployments/
 * and updates subgraph.yaml with the deployed contract addresses and start blocks
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Find latest deployment file
function findLatestDeployment() {
  const deploymentsDir = path.join(__dirname, '../../contracts/deployments');

  if (!fs.existsSync(deploymentsDir)) {
    console.error('❌ Deployments directory not found:', deploymentsDir);
    console.error('Please deploy contracts first: cd contracts && npm run deploy:arc');
    process.exit(1);
  }

  const files = fs
    .readdirSync(deploymentsDir)
    .filter((f) => f.endsWith('.json') && f.includes('arcTestnet'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No deployment files found in:', deploymentsDir);
    console.error('Please deploy contracts first: cd contracts && npm run deploy:arc');
    process.exit(1);
  }

  // Use the "latest" file if it exists, otherwise use most recent
  const latestFile = files.find((f) => f.includes('latest')) || files[0];
  const filepath = path.join(deploymentsDir, latestFile);

  console.log('📄 Using deployment file:', latestFile);

  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Update subgraph.yaml
function updateSubgraphConfig(deployment) {
  const subgraphYamlPath = path.join(__dirname, '../subgraph.yaml');

  console.log('📝 Updating subgraph.yaml...');

  // Read current subgraph.yaml
  let yamlContent = fs.readFileSync(subgraphYamlPath, 'utf8');

  // Replace NFTMarketplace address and startBlock
  yamlContent = yamlContent.replace(
    /name: NFTMarketplace[\s\S]*?address: "[^"]*"/m,
    `name: NFTMarketplace
    network: arc-testnet
    source:
      address: "${deployment.contracts.NFTMarketplace}"`
  );

  yamlContent = yamlContent.replace(
    /(name: NFTMarketplace[\s\S]*?startBlock: )\d+/m,
    `$1${deployment.deploymentBlock}`
  );

  // Replace FeeVault address and startBlock
  yamlContent = yamlContent.replace(
    /name: FeeVault[\s\S]*?address: "[^"]*"/m,
    `name: FeeVault
    network: arc-testnet
    source:
      address: "${deployment.contracts.FeeVault}"`
  );

  yamlContent = yamlContent.replace(
    /(name: FeeVault[\s\S]*?startBlock: )\d+/m,
    `$1${deployment.deploymentBlock}`
  );

  // Replace ProfileRegistry address and startBlock
  yamlContent = yamlContent.replace(
    /name: ProfileRegistry[\s\S]*?address: "[^"]*"/m,
    `name: ProfileRegistry
    network: arc-testnet
    source:
      address: "${deployment.contracts.ProfileRegistry}"`
  );

  yamlContent = yamlContent.replace(
    /(name: ProfileRegistry[\s\S]*?startBlock: )\d+/m,
    `$1${deployment.deploymentBlock}`
  );

  // Write updated subgraph.yaml
  fs.writeFileSync(subgraphYamlPath, yamlContent);

  console.log('✅ subgraph.yaml updated successfully!');
  console.log('');
  console.log('Updated contracts:');
  console.log('  NFTMarketplace:', deployment.contracts.NFTMarketplace);
  console.log('  FeeVault:', deployment.contracts.FeeVault);
  console.log('  ProfileRegistry:', deployment.contracts.ProfileRegistry);
  console.log('  Start Block:', deployment.deploymentBlock);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('  1. Run: npm run codegen');
  console.log('  2. Run: npm run build');
  console.log('  3. Run: npm run deploy:studio');
  console.log('');
  console.log('⚠️  NOTE: Arc blockchain may not be supported by The Graph yet.');
  console.log('   Contact The Graph team or Circle for Arc indexing support.');
}

// Main
try {
  console.log('🔧 ArcMarket Subgraph Configuration Updater\n');

  const deployment = findLatestDeployment();

  console.log('Deployment Info:');
  console.log('  Network:', deployment.network);
  console.log('  Chain ID:', deployment.chainId);
  console.log('  Deployer:', deployment.deployer);
  console.log('  Timestamp:', deployment.timestamp);
  console.log('');

  updateSubgraphConfig(deployment);

  console.log('✅ Configuration update complete!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
