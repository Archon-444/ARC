/**
 * Generalized offline compile check for the trust-layer contracts.
 *
 * Walks one or more directories under `contracts/contracts/`,
 * compiles every .sol via the locally-installed solc-js, and reports
 * per-contract bytecode size + warnings. Resolves
 * @openzeppelin/contracts and relative imports.
 *
 * Used as the in-env compile gate (Hardhat's `compile` requires
 * fetching the pinned solc binary, which sandboxed dev environments
 * cannot do). NOT a replacement for the behavioral Hardhat suites —
 * those are user-fired from a host with internet access.
 *
 * Usage:
 *   node scripts/check-contracts.js                  # default groups
 *   node scripts/check-contracts.js passport
 *   node scripts/check-contracts.js passport reputation attestations
 *
 * Default groups (when no args given): passport, reputation, attestations.
 *
 * Exit code: 0 on clean compile of every group, non-zero on any error.
 */
const fs = require('fs');
const path = require('path');
const solc = require('solc');

const ROOT = path.resolve(__dirname, '..');
const CONTRACTS_BASE = path.join(ROOT, 'contracts');
const OZ_BASE = path.resolve(ROOT, '..', 'node_modules', '@openzeppelin', 'contracts');

const DEFAULT_GROUPS = ['passport', 'reputation', 'attestations', 'validation'];

function readSources(group) {
  const root = path.join(CONTRACTS_BASE, group);
  if (!fs.existsSync(root)) return {};
  const sources = {};
  function walk(dir, prefix) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full, `${prefix}/${ent.name}`);
      else if (ent.name.endsWith('.sol')) {
        sources[`${prefix}/${ent.name}`] = { content: fs.readFileSync(full, 'utf8') };
      }
    }
  }
  walk(root, group);
  return sources;
}

function makeImportResolver(groupRoots) {
  return function findImports(importPath) {
    if (importPath.startsWith('@openzeppelin/contracts/')) {
      const rel = importPath.slice('@openzeppelin/contracts/'.length);
      const full = path.join(OZ_BASE, rel);
      if (fs.existsSync(full)) return { contents: fs.readFileSync(full, 'utf8') };
      return { error: `not found: ${full}` };
    }
    // Relative imports resolve against each group root we've collected.
    // The compiler invokes findImports with the path AS WRITTEN in the
    // importing file (e.g. "./interfaces/IERC8004Reputation.sol"),
    // which the compiler combines with the importer's source key
    // BEFORE calling us in some setups — but in this solc-js path it
    // gives us the raw "./..." string. Resolve relative paths against
    // every group root and return the first hit.
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      for (const root of groupRoots) {
        const candidate = path.join(root, importPath);
        if (fs.existsSync(candidate)) {
          return { contents: fs.readFileSync(candidate, 'utf8') };
        }
      }
      return { error: `not found local: ${importPath}` };
    }
    return { error: `unhandled import: ${importPath}` };
  };
}

function compileGroup(group, importResolver) {
  const sources = readSources(group);
  if (Object.keys(sources).length === 0) {
    console.log(`[${group}] no sources at contracts/${group}, skipping`);
    return { errors: [], warnings: [], emitted: [], skipped: true };
  }

  const input = {
    language: 'Solidity',
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };

  const out = JSON.parse(solc.compile(JSON.stringify(input), { import: importResolver }));
  const errors = (out.errors || []).filter((e) => e.severity === 'error');
  const warnings = (out.errors || []).filter((e) => e.severity === 'warning');

  const emitted = [];
  for (const file of Object.keys(out.contracts || {}).sort()) {
    for (const c of Object.keys(out.contracts[file])) {
      const bytes = (out.contracts[file][c].evm?.bytecode?.object || '').length / 2;
      if (bytes > 0) emitted.push({ file, contract: c, bytes });
    }
  }

  return { errors, warnings, emitted };
}

function main() {
  if (!fs.existsSync(OZ_BASE)) {
    console.error(
      `@openzeppelin/contracts not found at ${OZ_BASE}; run \`npm install\` from repo root.`
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const groups = args.length > 0 ? args : DEFAULT_GROUPS;

  // Build importer once across all groups so relative imports across
  // groups (e.g. attestations importing a passport interface, should
  // that ever happen) work.
  const groupRoots = groups.map((g) => path.join(CONTRACTS_BASE, g));
  const importResolver = makeImportResolver(groupRoots);

  let hadError = false;
  console.log(`compiler: solc ${solc.version()}`);
  console.log(`groups:   ${groups.join(', ')}`);
  console.log('');

  for (const group of groups) {
    const { errors, warnings, emitted, skipped } = compileGroup(group, importResolver);
    if (skipped) {
      console.log('');
      continue;
    }
    if (errors && errors.length > 0) {
      hadError = true;
      console.error(`[${group}] COMPILE FAILED:`);
      for (const e of errors) console.error(e.formattedMessage);
      console.error('');
      continue;
    }
    for (const w of warnings || []) {
      console.warn(`[${group}] WARNING: ${w.formattedMessage.split('\n')[0]}`);
    }
    console.log(`[${group}] contracts:`);
    for (const e of emitted) console.log(`  ${e.file}:${e.contract} bytecode=${e.bytes}B`);
    console.log('');
  }

  if (hadError) process.exit(1);
  console.log('check-contracts OK');
}

main();
