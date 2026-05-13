/**
 * Deploy ArcIdentityAdapter + ArcPassport to a Hardhat network.
 *
 * Atomic deploy: the script grants REGISTRAR_ROLE on the adapter to
 * the just-deployed Passport contract in the same run, so the Passport
 * is the sole writer in production from block one. Optional COUNSEL
 * grant via env var.
 *
 *   npm --workspace contracts run deploy:passport:arc-testnet
 *
 * Env:
 *   PRIVATE_KEY              - deployer key (set in contracts/.env)
 *   ARC_TESTNET_RPC_URL      - RPC override (default matches hardhat.config.js)
 *   PASSPORT_COUNSEL_ADDRESS - optional; if set, granted COUNSEL_ROLE
 *                              on the Passport in the same transaction
 *                              window so the regulated KYB workflow can
 *                              start attaching attestations immediately.
 *
 * Output:
 *   Prints the two deployed addresses + a copy-paste block for
 *   contracts/docs/PASSPORT.md "Known deployments" table.
 */
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  console.log(`\n=== ArcPassport deploy ===`);
  console.log(`network:    ${network} (chainId=${chainId})`);
  console.log(`deployer:   ${deployer.address}`);

  // 1. ArcIdentityAdapter — admin = deployer.
  const ArcIdentityAdapter = await hre.ethers.getContractFactory("ArcIdentityAdapter");
  const adapter = await ArcIdentityAdapter.deploy(deployer.address);
  await adapter.waitForDeployment();
  const adapterAddr = await adapter.getAddress();
  console.log(`adapter:    ${adapterAddr}`);

  // 2. ArcPassport — admin = deployer, adapter = #1.
  const ArcPassport = await hre.ethers.getContractFactory("ArcPassport");
  const passport = await ArcPassport.deploy(deployer.address, adapterAddr);
  await passport.waitForDeployment();
  const passportAddr = await passport.getAddress();
  console.log(`passport:   ${passportAddr}`);

  // 3. Grant the Passport contract REGISTRAR_ROLE on the adapter.
  //    This is what makes the Passport the sole writer in production.
  const REGISTRAR_ROLE = hre.ethers.id("REGISTRAR_ROLE");
  const grantTx = await adapter.grantRole(REGISTRAR_ROLE, passportAddr);
  await grantTx.wait();
  console.log(`granted REGISTRAR_ROLE on adapter to passport (tx: ${grantTx.hash})`);

  // 4. Optional: grant COUNSEL_ROLE.
  const counselAddr = process.env.PASSPORT_COUNSEL_ADDRESS;
  if (counselAddr && counselAddr.length === 42) {
    const COUNSEL_ROLE = hre.ethers.id("COUNSEL_ROLE");
    const counselTx = await passport.grantRole(COUNSEL_ROLE, counselAddr);
    await counselTx.wait();
    console.log(`granted COUNSEL_ROLE on passport to ${counselAddr} (tx: ${counselTx.hash})`);
  } else {
    console.log(`PASSPORT_COUNSEL_ADDRESS unset — no COUNSEL_ROLE grant in this run.`);
  }

  // 5. Smoke read.
  const liveAdapter = await passport.identityAdapter();
  if (liveAdapter.toLowerCase() !== adapterAddr.toLowerCase()) {
    throw new Error(`smoke read failed: passport.identityAdapter() = ${liveAdapter}, expected ${adapterAddr}`);
  }
  console.log(`smoke read: passport.identityAdapter() == adapter OK`);

  // 6. Print the doc block.
  const date = new Date().toISOString().slice(0, 10);
  console.log(`\n--- copy/paste into contracts/docs/PASSPORT.md ---`);
  console.log(`| ${date} | ${network} (chainId=${chainId}) | \`${adapterAddr}\` | \`${passportAddr}\` | deployer \`${deployer.address}\` |`);
  console.log(`---------------------------------------------------\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
