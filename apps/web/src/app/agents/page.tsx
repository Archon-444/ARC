import Link from 'next/link';
import { Users, Bot } from 'lucide-react';

import { Badge, Card } from '@/components/ui';

export const metadata = {
  title: 'Agents · ARC',
  description:
    'Directory of agents and integrations that consume ARC trust reads through MCP. Public directory ships once a handful of design partners are live.',
};

export default function AgentsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-6">
      <header className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">
          Agents
        </p>
      </header>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
        Agents using ARC trust reads
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
        The public directory of agents and integrations that consume ARC trust reads through MCP
        will land once enough design partners are live to make it useful. Until then, here is the
        runtime shape:
      </p>

      <Card className="mt-6">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Distribution surface (live)</h2>
            <Badge variant="success">shipped</Badge>
          </div>
          <ul className="mt-3 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-3">
              <Bot className="mt-0.5 h-5 w-5 flex-none text-primary-500" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  <code className="font-mono text-xs">@arc/mcp-server</code>
                </p>
                <p className="mt-1">
                  stdio + Streamable HTTP transports. Three tools:{' '}
                  <code className="font-mono text-xs">arc_trust_read</code> ($0.01),{' '}
                  <code className="font-mono text-xs">arc_passport_get</code> (free),{' '}
                  <code className="font-mono text-xs">arc_search</code> (free placeholder).
                  Signing-payer mode (<code className="font-mono text-xs">ARC_MCP_PAYER_PRIVATE_KEY</code>
                  ) lets the server transparently complete $0.01 USDC payments on Base mainnet on the
                  agent's behalf.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Bot className="mt-0.5 h-5 w-5 flex-none text-primary-500" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  <code className="font-mono text-xs">skills/use-arc-trust</code>
                </p>
                <p className="mt-1">
                  A Claude Skill teaching the trust-read gate: before sending USDC or signing for
                  an unfamiliar EVM address, call{' '}
                  <code className="font-mono text-xs">arc_trust_read(target)</code> and refuse
                  silently below the threshold.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Bot className="mt-0.5 h-5 w-5 flex-none text-primary-500" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">
                  Coinbase x402 Bazaar listing
                </p>
                <p className="mt-1">
                  Listing payload prepared in{' '}
                  <code className="font-mono text-xs">docs/bazaar-listing.md</code>; submission
                  happens once the hosted MCP-server URL is live.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Directory (not yet)</h2>
            <Badge variant="neutral">later</Badge>
          </div>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
            Listing agents publicly is its own product surface — it interacts with attribution,
            ranking, and abuse handling in ways that warrant their own pass. The directory lands
            after a handful of design partners are live and have produced enough usage data to make
            the ranking work without manual curation.
          </p>
        </div>
      </Card>

      <div className="mt-8 text-sm text-neutral-500">
        See <Link href="/docs" className="text-primary-500 underline">the docs</Link> for the
        end-to-end MCP integration and the published attestation schemas.
      </div>
    </main>
  );
}
