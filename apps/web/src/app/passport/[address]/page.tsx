import Link from 'next/link';
import { IdCard, ArrowRight } from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { fetchPassport, isValidEvmAddress } from '@/lib/trust-surface';

export const dynamic = 'force-dynamic';

interface Params {
  address: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { address } = await params;
  return {
    title: `Passport — ${address.slice(0, 10)}… · ARC`,
    description:
      'ARC Passport lookup. ERC-8004-aligned identity record (DRAFT spec; adapter-staged Identity → Reputation → Validation).',
  };
}

export default async function PassportPage({ params }: { params: Promise<Params> }) {
  const { address: rawAddress } = await params;
  const address = decodeURIComponent(rawAddress).toLowerCase();

  if (!isValidEvmAddress(address)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Invalid address</h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          <code className="font-mono text-xs">{rawAddress}</code> is not a valid EVM address.
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

  const result = await fetchPassport(address);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-6">
      <header className="flex items-center gap-3">
        <IdCard className="h-6 w-6 text-primary-500" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-500">
          ARC Passport
        </p>
      </header>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
        Passport for <span className="font-mono text-xl">{address.slice(0, 6)}…{address.slice(-4)}</span>
      </h1>
      <p className="mt-2 break-all font-mono text-xs text-neutral-500">{address}</p>

      {result.ok ? (
        <PassportPanel passport={result.passport} />
      ) : (
        <UnavailablePanel status={result.status} reason={result.reason} />
      )}

      <Card className="mt-8">
        <div className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            What a real Passport carries
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <li>
              <span className="font-medium text-neutral-900 dark:text-white">Identity record</span>{' '}
              — subject address, IPFS metadataURI, revocation state. Routed through{' '}
              <code className="font-mono text-xs">ArcIdentityAdapter</code> behind a
              swap-without-state-migration pointer (see{' '}
              <Link href="/docs" className="text-primary-500 underline">
                docs
              </Link>
              ).
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-white">Counsel attestation</span>{' '}
              — an anchored EIP-712 hash from{' '}
              <code className="font-mono text-xs">AttestationRegistry</code>, populated by
              counsel-led KYB workflows.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-white">Reputation feedback</span>{' '}
              — append-only single-signer feedback with sentiment in [-100, 100]; aggregated
              off-chain by consumers.
            </li>
            <li>
              <span className="font-medium text-neutral-900 dark:text-white">MENA evidence</span>{' '}
              — when present, attached{' '}
              <code className="font-mono text-xs">token.suitability.v1</code> and{' '}
              <code className="font-mono text-xs">stablecoin.reserves.v1</code> attestations
              mapped to DFSA + ADGM regulatory criteria.
            </li>
          </ul>
        </div>
      </Card>

      <div className="mt-6">
        <Link
          href={`/trust/${address}`}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-primary-500 hover:underline"
        >
          See the editorial trust read for this address{' '}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </main>
  );
}

function PassportPanel({ passport }: { passport: { passport: unknown | null; status: string; notice?: string } }) {
  const indexed = passport.passport !== null;
  return (
    <Card className="mt-6">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Record</h2>
          <Badge variant={indexed ? 'success' : 'neutral'}>{passport.status}</Badge>
        </div>
        {indexed ? (
          <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-50 p-3 text-xs text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
            {JSON.stringify(passport.passport, null, 2)}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
            {passport.notice ?? 'No on-chain passport indexed yet for this address.'} The Passport
            contract is deployed to Arc testnet; until trust-api is reconfigured to consult it via{' '}
            <code className="font-mono text-xs">@arc/passport-sdk</code>, this route surfaces the
            placeholder.
          </p>
        )}
      </div>
    </Card>
  );
}

function UnavailablePanel({ status, reason }: { status: string; reason: string }) {
  return (
    <Card className="mt-6 border-neutral-300 dark:border-neutral-700">
      <div className="p-5">
        <h2 className="text-base font-semibold">
          {status === 'unconfigured' ? 'Trust API not configured' : 'Passport lookup unavailable'}
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{reason}</p>
      </div>
    </Card>
  );
}
