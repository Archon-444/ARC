import Link from 'next/link';
import { Archive, ExternalLink } from 'lucide-react';

import { Card } from '@/components/ui';

export const metadata = {
  title: 'Legacy — frozen primitives · ARC',
  description:
    "The original ARC NFT marketplace and token launcher are preserved as primitives but are no longer the product. This page explains the freeze and links to the contracts on-chain.",
};

interface SearchParams {
  from?: string;
}

export default async function LegacyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const from = typeof sp.from === 'string' ? sp.from : undefined;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-6">
      <header className="flex items-center gap-3">
        <Archive className="h-6 w-6 text-neutral-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
          Legacy
        </p>
      </header>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
        Frozen primitives
      </h1>

      {from && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
          You were redirected from{' '}
          <code className="font-mono text-xs">{from}</code> because that surface is frozen. The
          contracts it referenced are still deployed on Arc testnet (see below); the consumer UX is
          no longer maintained.
        </p>
      )}

      <p className="mt-6 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
        ARC pivoted from a full-stack NFT marketplace + token launcher into the trust, identity,
        and editorial-verification layer for Circle-native agent commerce. The original smart
        contracts stay deployed and on-chain — they are <em>preserved as primitives</em>, not
        deprecated — but the consumer-facing UI does not get new feature work. The pivot rationale
        is in <Link href="https://github.com/Archon-444/ARC/blob/claude/trust-layer-agents-sNcay/STRATEGIC_PIVOT.md" className="text-primary-500 underline">STRATEGIC_PIVOT.md</Link>.
      </p>

      <Card className="mt-6">
        <div className="p-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            What stays on-chain
          </h2>
          <ul className="mt-3 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              <code className="font-mono text-xs">ArcMarketplace</code>,{' '}
              <code className="font-mono text-xs">ArcMarketNFT</code> — listings + auctions
            </li>
            <li>
              <code className="font-mono text-xs">ArcTokenFactory</code>,{' '}
              <code className="font-mono text-xs">ArcBondingCurveAMM</code>,{' '}
              <code className="font-mono text-xs">ArcToken</code> — the token launcher
            </li>
            <li>
              <code className="font-mono text-xs">ProfileRegistry</code> — superseded by{' '}
              <code className="font-mono text-xs">ArcPassport</code>; the W8 migration helper
              hydrates passports from the existing record
            </li>
            <li>
              <code className="font-mono text-xs">StakingRewards</code>,{' '}
              <code className="font-mono text-xs">SimpleGovernance</code>,{' '}
              <code className="font-mono text-xs">FeeVault</code> — read-only references
            </li>
          </ul>
          <p className="mt-3 text-xs text-neutral-500">
            All eleven contracts (plus <code className="font-mono">MockUSDC</code>) remain deployed
            on Arc testnet. Nothing has been upgraded since the pivot; the source is in{' '}
            <code className="font-mono text-xs">contracts/contracts/</code> with the W8-W10
            trust-layer surfaces alongside.
          </p>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="p-5">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Where the product lives now
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              <Link href="/trust/0x1234567890abcdef1234567890abcdef12345678" className="text-primary-500 underline">
                /trust/[target]
              </Link>{' '}
              — editorial trust read ($0.01 per call via x402, settled in USDC on Base mainnet).
            </li>
            <li>
              <Link href="/passport/0x1234567890abcdef1234567890abcdef12345678" className="text-primary-500 underline">
                /passport/[address]
              </Link>{' '}
              — ARC Passport lookup (free).
            </li>
            <li>
              <Link href="/agents" className="text-primary-500 underline">
                /agents
              </Link>{' '}
              — distribution surface for MCP-aware agents.
            </li>
            <li>
              <Link href="/docs" className="text-primary-500 underline">
                /docs
              </Link>{' '}
              — full integration guide and the five attestation schemas.
            </li>
          </ul>
        </div>
      </Card>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to home
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}
