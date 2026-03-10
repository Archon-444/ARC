import type { Metadata } from 'next';
import Link from 'next/link';
import { Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | ARC',
  description: 'About the ARC marketplace, launchpad, and token discovery platform on Arc blockchain.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary-100 p-2 dark:bg-primary-900/30">
          <Info className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">About ARC</h1>
      </div>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-neutral-600 dark:text-neutral-300">
          ARC is a full-stack NFT marketplace and token launchpad built on Circle&apos;s Arc blockchain. We unify marketplace discovery, token launches, live token markets, analytics, and wallet-native progression in one platform. USDC is used for gas and payments with sub-second finality.
        </p>
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">
          This page will be expanded with team, mission, and roadmap for investors and the community.
        </p>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/contact" className="text-primary-600 hover:underline dark:text-primary-400">Contact us</Link> for partnerships or inquiries.
        </p>
      </div>
      <p className="mt-8">
        <Link href="/" className="text-primary-600 hover:underline dark:text-primary-400">← Back to home</Link>
      </p>
    </div>
  );
}
