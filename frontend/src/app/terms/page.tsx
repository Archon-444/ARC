import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | ARC',
  description: 'Terms of Service for the ARC marketplace, launchpad, and token discovery platform.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary-100 p-2 dark:bg-primary-900/30">
          <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Terms of Service</h1>
      </div>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-neutral-600 dark:text-neutral-300">
          By using ARC (the marketplace, launchpad, and token discovery platform), you agree to these terms.
          Full terms of service will be published here. This page is a placeholder for institutional and legal review.
        </p>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          For questions, see <Link href="/contact" className="text-primary-600 hover:underline dark:text-primary-400">Contact</Link>.
        </p>
      </div>
      <p className="mt-8">
        <Link href="/" className="text-primary-600 hover:underline dark:text-primary-400">← Back to home</Link>
      </p>
    </div>
  );
}
