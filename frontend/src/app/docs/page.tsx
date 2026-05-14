import Link from 'next/link';
import { BookOpen, GitBranch, Coins, FileSignature, ShieldCheck, Plug } from 'lucide-react';

import { Badge, Card } from '@/components/ui';

export const metadata = {
  title: 'Docs · ARC',
  description:
    'How to integrate the ARC trust layer: MCP server, x402 trust-read API, Passport contracts, and the five EIP-712 attestation schemas.',
};

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16 lg:px-6">
      <header className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">Docs</p>
      </header>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
        Integrate the ARC trust layer
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
        Four surfaces. Pick the one your integration runs against and read the linked source as the
        authoritative reference — these pages are an orientation guide, not specification.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary-500" />
              <h2 className="text-base font-semibold">
                <code className="font-mono">@arc/mcp-server</code>
              </h2>
              <Badge variant="success">live</Badge>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Model Context Protocol server. Three tools over stdio or Streamable HTTP. Drop into any
              MCP-aware agent (Claude Code, Cursor, Codex CLI, Bazaar-aware tooling).
            </p>
            <ul className="mt-3 space-y-1 text-xs text-neutral-500">
              <li>
                Source:{' '}
                <code className="font-mono">apps/mcp-server/</code>
              </li>
              <li>
                Skill bundle: <code className="font-mono">skills/use-arc-trust/</code>
              </li>
              <li>
                Bazaar listing: <code className="font-mono">docs/bazaar-listing.md</code>
              </li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary-500" />
              <h2 className="text-base font-semibold">
                <code className="font-mono">@arc/trust-api</code>
              </h2>
              <Badge variant="success">live</Badge>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Pay-per-call x402 endpoint. <code className="font-mono text-xs">$0.01</code> read +{' '}
              <code className="font-mono text-xs">$0.05</code> editorial deep tier with prompt
              caching. Settled on Base mainnet USDC via the public x402 facilitator.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-neutral-500">
              <li>
                Source: <code className="font-mono">apps/trust-api/</code>
              </li>
              <li>
                Endpoints: <code className="font-mono">/v1/trust/read</code>,{' '}
                <code className="font-mono">/v1/trust/read/deep</code>,{' '}
                <code className="font-mono">/v1/passport/:address</code>
              </li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary-500" />
              <h2 className="text-base font-semibold">
                <code className="font-mono">contracts/passport/</code>
              </h2>
              <Badge variant="primary">in tree</Badge>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              ERC-8004-aligned (DRAFT spec; adapter-staged) identity primitives. Soulbound passport,
              counsel attestation hook, swap-without-state-migration adapter pointer.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-neutral-500">
              <li>
                Source: <code className="font-mono">contracts/contracts/passport/</code>
              </li>
              <li>
                Runbook: <code className="font-mono">contracts/docs/PASSPORT.md</code>
              </li>
              <li>
                SDK: <code className="font-mono">@arc/passport-sdk</code>
              </li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary-500" />
              <h2 className="text-base font-semibold">
                <code className="font-mono">@arc/attestations</code>
              </h2>
              <Badge variant="primary">in tree</Badge>
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              EIP-712 typed-data schemas + sign/verify helpers. Five schemas covering counsel KYB,
              editorial review, treasury policy, and the MENA-mapped DFSA / ADGM FRT pair.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-neutral-500">
              <li>
                Source: <code className="font-mono">packages/attestations/src/schemas/</code>
              </li>
              <li>
                Registry: <code className="font-mono">contracts/contracts/attestations/AttestationRegistry.sol</code>
              </li>
            </ul>
          </div>
        </Card>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-white">
          <GitBranch className="h-5 w-5 text-primary-500" />
          Attestation schemas
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Each schema anchors an EIP-712 digest in{' '}
          <code className="font-mono text-xs">AttestationRegistry</code>; full bodies live in
          IPFS/S3. The schemas in the MENA-mapped pair are marked{' '}
          <em>counsel-review draft</em> until counsel signs off on the field shapes against the
          live regulatory criteria.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="pb-2 pr-4">Schema</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Anchors evidence for…</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700 dark:text-neutral-300">
              <Row
                schema="counsel.kyb.v1"
                status="ready"
                purpose="Counsel-led KYB outcome (DIFC / ADGM / DMCC). Pairs with token.suitability.v1 for institutional flows."
              />
              <Row
                schema="editorial.review.v1"
                status="ready"
                purpose="ARC editorial verdict layered on top of the v1 heuristic scoreV1."
              />
              <Row
                schema="treasury.policy.v1"
                status="ready"
                purpose="Treasury policy of record for an institutional agent wallet (per-tx + per-day ceilings, principal signer)."
              />
              <Row
                schema="token.suitability.v1"
                status="counsel-review draft"
                purpose="DFSA Crypto Token framework-mapped per-token suitability assessment (Jan 12, 2026 effective)."
              />
              <Row
                schema="stablecoin.reserves.v1"
                status="counsel-review draft"
                purpose="ADGM FRT regime-mapped reserve attestation for CBUAE-registered Foreign Payment Tokens (USDU reference)."
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Standards posture</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          ERC-8004 is DRAFT; ARC implements it through adapters so the spec can shift without
          forcing a Passport-state migration. We publish a public compatibility matrix; we do not
          market downstream products as &quot;ERC-8004 compliant.&quot; x402 settlement uses the
          public facilitator on Base mainnet USDC. Arc mainnet remains upside, not a dependency —
          revenue is decoupled from its launch timing.
        </p>
      </section>

      <div className="mt-12 flex flex-wrap gap-3 text-sm">
        <Link
          href="/trust/0x1234567890abcdef1234567890abcdef12345678"
          className="rounded-full border border-neutral-300 px-5 py-2.5 font-semibold text-neutral-700 hover:border-primary-500 hover:text-primary-600 dark:border-neutral-700 dark:text-neutral-200"
        >
          Example trust read
        </Link>
        <Link
          href="/passport/0x1234567890abcdef1234567890abcdef12345678"
          className="rounded-full border border-neutral-300 px-5 py-2.5 font-semibold text-neutral-700 hover:border-primary-500 hover:text-primary-600 dark:border-neutral-700 dark:text-neutral-200"
        >
          Example passport lookup
        </Link>
        <Link
          href="/agents"
          className="rounded-full border border-neutral-300 px-5 py-2.5 font-semibold text-neutral-700 hover:border-primary-500 hover:text-primary-600 dark:border-neutral-700 dark:text-neutral-200"
        >
          Agents directory →
        </Link>
      </div>
    </main>
  );
}

function Row({ schema, status, purpose }: { schema: string; status: string; purpose: string }) {
  return (
    <tr className="border-t border-neutral-200 dark:border-neutral-800">
      <td className="py-3 pr-4 font-mono text-xs text-neutral-900 dark:text-white">{schema}</td>
      <td className="py-3 pr-4 text-xs">
        <Badge variant={status === 'ready' ? 'success' : 'warning'}>{status}</Badge>
      </td>
      <td className="py-3">{purpose}</td>
    </tr>
  );
}
