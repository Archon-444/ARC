import Link from 'next/link';
import { ShieldCheck, Wallet, ExternalLink } from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { fetchTrustQuote, formatUsdcAmount, isValidEvmAddress } from '@/lib/trust-surface';

export const dynamic = 'force-dynamic';

interface Params {
  target: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { target } = await params;
  return {
    title: `Trust read — ${target.slice(0, 10)}… · ARC`,
    description:
      'ARC editorial trust read for an EVM address. Distributed via MCP, monetised via x402.',
  };
}

export default async function TrustTargetPage({ params }: { params: Promise<Params> }) {
  const { target: rawTarget } = await params;
  const target = decodeURIComponent(rawTarget).toLowerCase();

  if (!isValidEvmAddress(target)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Invalid address</h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          <code className="font-mono text-xs">{rawTarget}</code> is not a valid EVM address. Trust
          reads work against 0x-prefixed 40-hex addresses on supported chains.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to home
        </Link>
      </main>
    );
  }

  const result = await fetchTrustQuote(target);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-6">
      <header className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">
          ARC Trust Read
        </p>
      </header>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
        Read for <span className="font-mono text-xl">{target.slice(0, 6)}…{target.slice(-4)}</span>
      </h1>
      <p className="mt-2 break-all font-mono text-xs text-neutral-500">{target}</p>

      {result.ok && result.status === 'quote' ? (
        <QuotePanel quote={result.quote} target={target} />
      ) : (
        <UnreadablePanel status={result.status} reason={result.reason} />
      )}

      <Card className="mt-8">
        <div className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            How agents read this surface
          </h2>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
            The browser surface only renders the price quote; the trust read itself is a paid
            $0.01 call settled in USDC on Base mainnet via the public x402 facilitator. Agents
            running through{' '}
            <Link href="/docs" className="text-primary-500 underline">
              <code className="font-mono text-xs">@arc/mcp-server</code>
            </Link>{' '}
            pay automatically when{' '}
            <code className="font-mono text-xs">ARC_MCP_PAYER_PRIVATE_KEY</code> is configured;
            unfunded agents surface the quote to the user and stop.
          </p>
        </div>
      </Card>
    </main>
  );
}

function QuotePanel({ quote, target }: { quote: { accepts: { network: string; maxAmountRequired: string; payTo: string; asset: string; description: string; resource: string }[] }; target: string }) {
  const accept = quote.accepts[0];
  if (!accept) {
    return (
      <Card className="mt-6 border-error-500/50 bg-error-500/5">
        <div className="p-5 text-sm text-error-700 dark:text-error-300">
          Quote has no accepts entry; trust-api configuration is incomplete.
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary-500" />
            <h2 className="text-base font-semibold">Payment required</h2>
          </div>
          <Badge variant="primary">{accept.network}</Badge>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Row label="Price" value={formatUsdcAmount(accept.maxAmountRequired)} />
          <Row label="Asset" value={`USDC · ${shorten(accept.asset)}`} mono />
          <Row label="Pay to" value={shorten(accept.payTo)} mono />
          <Row label="Resource" value={accept.resource} mono />
        </dl>

        <p className="mt-4 text-xs text-neutral-500">
          The endpoint returned a 402 quote because this request did not carry an{' '}
          <code className="font-mono">X-PAYMENT</code> envelope — the browser is read-only by
          design. Pay via an MCP-connected agent and the same endpoint returns the scoreV1
          assessment + (when funded) editorial commentary.
        </p>

        <p className="mt-3 text-xs text-neutral-500">
          Target: <span className="break-all font-mono text-[11px]">{target}</span>
        </p>
      </div>
    </Card>
  );
}

function UnreadablePanel({ status, reason }: { status: string; reason: string }) {
  const isUnconfigured = status === 'unconfigured';
  return (
    <Card className="mt-6 border-neutral-300 dark:border-neutral-700">
      <div className="p-5">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
          {isUnconfigured ? 'Trust API not configured' : 'Trust read unavailable'}
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{reason}</p>
        {isUnconfigured && (
          <p className="mt-3 text-xs text-neutral-500">
            Set <code className="font-mono">NEXT_PUBLIC_TRUST_API_URL</code> on the deployment to
            point at a running <code className="font-mono">@arc/trust-api</code> instance. Until
            then, this route stays in placeholder mode.
          </p>
        )}
        <Link
          href="/docs"
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary-500 hover:underline"
        >
          See the agent-side integration <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className={`mt-1 ${mono ? 'font-mono text-xs' : 'text-sm'} text-neutral-900 dark:text-white`}>
        {value}
      </dd>
    </div>
  );
}

function shorten(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
