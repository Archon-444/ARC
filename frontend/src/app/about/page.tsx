import type { Metadata } from 'next';
import Link from 'next/link';
import { Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | ARC',
  description: 'ARC is a USDC-native token launcher on Circle Arc. Creators earn on every trade.',
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
        <p className="text-lg font-medium text-neutral-900 dark:text-white">
          Creators earn on every trade. Traders buy a live curve. Unsold supply cannot be yanked.
        </p>
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">
          ARC is a USDC-native token launcher on Circle&apos;s Arc blockchain. Launch a coin, share the link, trade the bonding curve. Half of the 2.5% trade fee goes to the creator.
        </p>
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">
          NFT studio, listings, and auctions remain in the repo as a library. They are not the product.
        </p>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/contact" className="text-primary-600 hover:underline dark:text-primary-400">Contact</Link>
          {' · '}
          <Link href="/launch" className="text-primary-600 hover:underline dark:text-primary-400">Launch a token</Link>
        </p>
      </div>
      <p className="mt-8">
        <Link href="/" className="text-primary-600 hover:underline dark:text-primary-400">← Back to home</Link>
      </p>
    </div>
  );
}
