/**
 * Standalone compile check for the W8 passport contracts.
 *
 * Uses the locally-installed solc-js (via the `solc` npm package) to
 * compile every file under `contracts/passport/`. Resolves
 * `@openzeppelin/contracts/*` imports against the workspace's
 * node_modules and relative imports against the passport directory.
 *
 * Why this exists:
 *   - Hardhat's compile step always tries to download the pinned
 *     compiler version from binaries.soliditylang.org. Sandboxed dev
 *     environments (the one this branch was built in) cannot reach
 *     that host. `npm run check-passport` gives us a compile-only
 *     verification surface that runs offline.
 *   - It is NOT a replacement for `npm --workspace contracts run
 *     test:passport`, which is the behavioral gate. This script
 *     proves the Solidity parses and imports resolve; tests prove
 *     the contracts do the right thing.
 *
 * Run:
 *   npm --workspace contracts run check-passport
 */
const fs = require('fs');
const path = require('path');
const solc = require('solc');

const ROOT = path.resolve(__dirname, '..');
const PASSPORT_DIR = path.join(ROOT, 'contracts', 'passport');
const OZ_BASE = path.resolve(ROOT, '..', 'node_modules', '@openzeppelin', 'contracts');

if (!fs.existsSync(OZ_BASE)) {
  console.error(`@openzeppelin/contracts not found at ${OZ_BASE}; run \`npm install\` from repo root.`);
  process.exit(1);
}

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
walk(PASSPORT_DIR, 'passport');

function findImports(importPath) {
  if (importPath.startsWith('@openzeppelin/contracts/')) {
    const rel = importPath.slice('@openzeppelin/contracts/'.length);
    const full = path.join(OZ_BASE, rel);
    if (fs.existsSync(full)) return { contents: fs.readFileSync(full, 'utf8') };
    return { error: `not found: ${full}` };
  }
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const candidate = path.join(PASSPORT_DIR, importPath);
    if (fs.existsSync(candidate)) return { contents: fs.readFileSync(candidate, 'utf8') };
    return { error: `not found local: ${candidate}` };
  }
  return { error: `unhandled import: ${importPath}` };
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
};

const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (out.errors || []).filter((e) => e.severity === 'error');
if (errors.length > 0) {
  console.error('COMPILE FAILED:');
  for (const e of errors) console.error(e.formattedMessage);
  process.exit(1);
}
const warnings = (out.errors || []).filter((e) => e.severity === 'warning');
for (const w of warnings) {
  // Surface only the headline so the output stays scannable.
  console.warn('WARNING:', w.formattedMessage.split('\n')[0]);
}

console.log(`compiler: solc ${solc.version()}`);
console.log('contracts:');
for (const file of Object.keys(out.contracts || {}).sort()) {
  for (const c of Object.keys(out.contracts[file])) {
    const bytes = (out.contracts[file][c].evm?.bytecode?.object || '').length / 2;
    if (bytes === 0) continue; // skip interfaces / abstract contracts
    console.log(`  ${file}:${c} bytecode=${bytes}B`);
  }
}
console.log('check-passport OK');
