/**
 * Migration helper: hydrate ArcPassport from ProfileRegistry.
 *
 * The legacy ProfileRegistry maps `address -> { metadataURI, timestamp }`
 * with a `ProfileUpdated(address indexed user, string metadataURI)` event.
 * This script walks the event log between two block heights, builds the
 * latest URI per address (last write wins), and calls
 * `passport.mintFor(subject, metadataURI)` for every subject that does
 * not already have an active passport.
 *
 * Run from the admin wallet (deployer):
 *
 *   PASSPORT_ADDRESS=0x... \
 *   PROFILE_REGISTRY_ADDRESS=0x... \
 *   FROM_BLOCK=<block where ProfileRegistry was deployed> \
 *   TO_BLOCK=latest \
 *   DRY_RUN=true \
 *     npx hardhat run scripts/migrate-profile-registry.js --network arcTestnet
 *
 * Set DRY_RUN=false to actually send mint transactions. Default is
 * dry-run so the operator can review the projected migration before
 * spending gas.
 *
 * Idempotent: re-running the script after a partial migration is safe.
 * Subjects already holding a passport are skipped.
 */
const hre = require("hardhat");

function env(name, required = true) {
  const v = process.env[name];
  if (required && !v) {
    throw new Error(`migrate-profile-registry: env ${name} is required`);
  }
  return v;
}

async function main() {
  const passportAddr = env("PASSPORT_ADDRESS");
  const profileRegistryAddr = env("PROFILE_REGISTRY_ADDRESS");
  const fromBlock = Number(env("FROM_BLOCK"));
  const toBlockRaw = process.env.TO_BLOCK ?? "latest";
  const dryRun = (process.env.DRY_RUN ?? "true").toLowerCase() !== "false";
  const [admin] = await hre.ethers.getSigners();

  console.log(`\n=== ProfileRegistry -> ArcPassport migration ===`);
  console.log(`network:           ${hre.network.name}`);
  console.log(`admin (signer):    ${admin.address}`);
  console.log(`profile registry:  ${profileRegistryAddr}`);
  console.log(`passport:          ${passportAddr}`);
  console.log(`from block:        ${fromBlock}`);
  console.log(`to block:          ${toBlockRaw}`);
  console.log(`dry run:           ${dryRun ? "YES (no tx will be sent)" : "NO (tx will be sent)"}\n`);

  // Minimal ABI fragments — no need to import the artifact JSON here.
  const profileRegistryAbi = [
    "event ProfileUpdated(address indexed user, string metadataURI)",
  ];
  const passportAbi = [
    "function mintFor(address subject, string metadataURI) external returns (uint256)",
    "function resolveBySubject(address subject) external view returns (uint256)",
  ];

  const profileRegistry = new hre.ethers.Contract(
    profileRegistryAddr,
    profileRegistryAbi,
    admin
  );
  const passport = new hre.ethers.Contract(passportAddr, passportAbi, admin);

  const toBlock =
    toBlockRaw === "latest" ? await hre.ethers.provider.getBlockNumber() : Number(toBlockRaw);

  console.log(`scanning ProfileUpdated logs ${fromBlock}..${toBlock} ...`);
  const filter = profileRegistry.filters.ProfileUpdated();
  const logs = await profileRegistry.queryFilter(filter, fromBlock, toBlock);
  console.log(`raw logs: ${logs.length}`);

  // Build latest-URI-per-subject map.
  const latest = new Map();
  for (const log of logs) {
    latest.set(log.args.user, log.args.metadataURI);
  }
  console.log(`unique subjects: ${latest.size}\n`);

  let skipped = 0;
  let minted = 0;
  let errored = 0;

  for (const [subject, uri] of latest.entries()) {
    const existing = await passport.resolveBySubject(subject);
    if (existing !== 0n) {
      skipped += 1;
      console.log(`  [skip]    ${subject} -> already has passport id=${existing}`);
      continue;
    }
    if (!uri || uri.length === 0) {
      skipped += 1;
      console.log(`  [skip]    ${subject} -> empty URI`);
      continue;
    }

    if (dryRun) {
      console.log(`  [dryrun]  ${subject} -> mintFor uri="${uri.slice(0, 60)}${uri.length > 60 ? '…' : ''}"`);
      minted += 1;
      continue;
    }

    try {
      const tx = await passport.mintFor(subject, uri);
      const rcpt = await tx.wait();
      console.log(`  [mint]    ${subject} -> tx ${tx.hash} (block ${rcpt.blockNumber})`);
      minted += 1;
    } catch (err) {
      errored += 1;
      console.error(`  [error]   ${subject} -> ${err.message}`);
    }
  }

  console.log(`\n--- summary ---`);
  console.log(`subjects considered: ${latest.size}`);
  console.log(`would mint / minted: ${minted}`);
  console.log(`skipped:             ${skipped}`);
  console.log(`errored:             ${errored}`);
  if (dryRun) {
    console.log(`\nRe-run with DRY_RUN=false to actually mint.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
