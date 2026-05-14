/**
 * Deploy AttestationRegistry + ArcReputationAdapter + ArcValidationAdapter
 * to a Hardhat network.
 *
 * Atomic deploy: the script grants ATTESTER_ROLE (registry),
 * FEEDBACK_ROLE (reputation), and VALIDATOR_ROLE (validation) on each
 * contract to one or more operator addresses passed via env. Same
 * shape as `deploy-passport.js` — minimal, no new abstractions, just
 * the missing operator-fired step.
 *
 *   npm --workspace contracts run deploy:trust-suite:arc-testnet
 *
 * Env:
 *   PRIVATE_KEY                  - deployer key (set in contracts/.env)
 *   ARC_TESTNET_RPC_URL          - RPC override (default matches hardhat.config.js)
 *   ATTESTATION_ATTESTER_ADDRESS - optional; if set, granted ATTESTER_ROLE
 *                                  on the AttestationRegistry (the
 *                                  server-side signer your trust-api or
 *                                  off-chain pipeline uses to anchor).
 *   REPUTATION_FEEDBACK_ADDRESS  - optional; if set, granted FEEDBACK_ROLE
 *                                  on the ArcReputationAdapter (the
 *                                  signer that posts append-only feedback).
 *   VALIDATION_VALIDATOR_ADDRESS - optional; if set, granted VALIDATOR_ROLE
 *                                  on the ArcValidationAdapter (the
 *                                  narrow-validation signer).
 *
 * Output:
 *   Prints the three deployed addresses + a copy-paste env block ready
 *   to drop into `apps/trust-api/.env` and `apps/indexer/.env`.
 */
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  console.log(`\n=== ARC trust-suite deploy ===`);
  console.log(`network:    ${network} (chainId=${chainId})`);
  console.log(`deployer:   ${deployer.address}`);

  // 1. AttestationRegistry
  const AttestationRegistry = await hre.ethers.getContractFactory("AttestationRegistry");
  const registry = await AttestationRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log(`registry:   ${registryAddr}`);

  // 2. ArcReputationAdapter
  const ArcReputationAdapter = await hre.ethers.getContractFactory("ArcReputationAdapter");
  const reputation = await ArcReputationAdapter.deploy(deployer.address);
  await reputation.waitForDeployment();
  const reputationAddr = await reputation.getAddress();
  console.log(`reputation: ${reputationAddr}`);

  // 3. ArcValidationAdapter
  const ArcValidationAdapter = await hre.ethers.getContractFactory("ArcValidationAdapter");
  const validation = await ArcValidationAdapter.deploy(deployer.address);
  await validation.waitForDeployment();
  const validationAddr = await validation.getAddress();
  console.log(`validation: ${validationAddr}`);

  // 4. Optional role grants.
  const attester = process.env.ATTESTATION_ATTESTER_ADDRESS;
  if (attester && attester.length === 42) {
    const ATTESTER_ROLE = hre.ethers.id("ATTESTER_ROLE");
    const tx = await registry.grantRole(ATTESTER_ROLE, attester);
    await tx.wait();
    console.log(`granted ATTESTER_ROLE on registry to ${attester} (tx: ${tx.hash})`);
  } else {
    console.log(`ATTESTATION_ATTESTER_ADDRESS unset — no ATTESTER_ROLE grant in this run.`);
  }

  const feedback = process.env.REPUTATION_FEEDBACK_ADDRESS;
  if (feedback && feedback.length === 42) {
    const FEEDBACK_ROLE = hre.ethers.id("FEEDBACK_ROLE");
    const tx = await reputation.grantRole(FEEDBACK_ROLE, feedback);
    await tx.wait();
    console.log(`granted FEEDBACK_ROLE on reputation to ${feedback} (tx: ${tx.hash})`);
  } else {
    console.log(`REPUTATION_FEEDBACK_ADDRESS unset — no FEEDBACK_ROLE grant in this run.`);
  }

  const validator = process.env.VALIDATION_VALIDATOR_ADDRESS;
  if (validator && validator.length === 42) {
    const VALIDATOR_ROLE = hre.ethers.id("VALIDATOR_ROLE");
    const tx = await validation.grantRole(VALIDATOR_ROLE, validator);
    await tx.wait();
    console.log(`granted VALIDATOR_ROLE on validation to ${validator} (tx: ${tx.hash})`);
  } else {
    console.log(`VALIDATION_VALIDATOR_ADDRESS unset — no VALIDATOR_ROLE grant in this run.`);
  }

  // 5. Copy-paste env block for the operator.
  console.log(`\n--- copy/paste into apps/trust-api/.env and apps/indexer/.env ---`);
  console.log(`ARC_ATTESTATION_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`ARC_REPUTATION_ADAPTER_ADDRESS=${reputationAddr}`);
  console.log(`ARC_VALIDATION_ADAPTER_ADDRESS=${validationAddr}`);
  console.log(`-----------------------------------------------------------------\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
