import Link from 'next/link';
import { Hexagon, ShieldCheck, Plug, FileSignature, Globe2 } from 'lucide-react';

export const metadata = {
  title: 'ARC — Trust Layer for Agent Commerce',
  description:
    'ARC is the trust, identity, and editorial-verification layer for Circle-native agent commerce: MCP-distributed, x402-monetised, ERC-8004-aligned.',
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:py-20 lg:px-6">
      <section className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30">
          <Hexagon className="h-7 w-7 fill-white" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">
          Trust Layer for Agent Commerce
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
          The independent trust layer for Circle-native agents.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-neutral-600 dark:text-neutral-300 sm:text-lg">
          ARC is the trust, identity, and editorial-verification layer Circle Agent Stack and Coinbase x402
          Bazaar do not provide. Distributed via MCP. Monetised via x402. Anchored by ARC Passport, aligned
          to ERC-8004. Built for MENA institutional and treasury-oriented agent commerce.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://github.com/Archon-444/ARC/blob/claude/trust-layer-agents-sNcay/STRATEGIC_PIVOT.md"
            className="rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-colors hover:bg-primary-600"
          >
            Read the pivot
          </a>
          <Link
            href="/docs"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary-500 hover:text-primary-600 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-primary-400 dark:hover:text-primary-300"
          >
            Docs (coming W11)
          </Link>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          The marketplace and token launcher remain deployed as preserved primitives and are not the
          product. See <Link href="/legacy" className="underline">Legacy</Link> for the original surface.
        </p>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Pillar
          icon={<Plug className="h-5 w-5" />}
          title="MCP server"
          body="arc_trust_read, arc_search, arc_passport_get — callable from any Claude / Codex / Cursor / Bazaar-aware agent."
          status="W6"
        />
        <Pillar
          icon={<ShieldCheck className="h-5 w-5" />}
          title="x402 trust API"
          body="Pay-per-call trust reads at $0.01 / $0.05, settled in USDC on Base via the public x402 facilitator."
          status="W3-5"
        />
        <Pillar
          icon={<FileSignature className="h-5 w-5" />}
          title="ARC Passport"
          body="Arc-native identity, ERC-8004-aligned via adapter. Identity-first, Reputation next, Validation narrow."
          status="W8-10"
        />
        <Pillar
          icon={<Globe2 className="h-5 w-5" />}
          title="MENA-mapped schemas"
          body="EIP-712 attestations for KYB, editorial review, treasury policy, token suitability (DFSA) and stablecoin reserves (ADGM FRT)."
          status="W9-10"
        />
      </section>

      <section className="mt-16 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/40">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
          What is shipping
        </h2>
        <ul className="mt-4 space-y-3 text-sm text-neutral-700 dark:text-neutral-200">
          <li>
            <span className="font-semibold">Now (W1):</span> workspace root, trust-layer positioning, freeze on
            generic marketplace UX, README + STRATEGIC_PIVOT.md.
          </li>
          <li>
            <span className="font-semibold">W2:</span> <code>@arc/trust-core</code> extracted with the v1
            heuristic scoring engine and cache helpers.
          </li>
          <li>
            <span className="font-semibold">W3-7:</span> trust-api with facilitator-backed x402 on Base, MCP
            server stdio, IDE skill publication.
          </li>
          <li>
            <span className="font-semibold">W8-12:</span> ARC Passport on Arc testnet, MENA-mapped
            attestations, trust surface in <code>apps/web</code>, first design partner.
          </li>
        </ul>
      </section>

      <footer className="mt-16 text-center text-xs text-neutral-400">
        <p>
          Compliance-first, counsel-led. ERC-8004 is DRAFT; ARC is{' '}
          <span className="font-semibold">aligned via adapter</span>, not compliant. Arc mainnet is
          optionality, not a dependency.
        </p>
      </footer>
    </main>
  );
}

function Pillar({
  icon,
  title,
  body,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-primary-500">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-[0.15em]">{status}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{body}</p>
    </div>
  );
}
