import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact | ARC',
  description: 'Contact the ARC marketplace team for support, partnerships, and inquiries.',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-primary-100 p-2 dark:bg-primary-900/30">
          <Mail className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Contact</h1>
      </div>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-neutral-600 dark:text-neutral-300">
          For support, partnership inquiries, or institutional contact, please reach out through your designated channel or the project repository. This page will be updated with formal contact details for compliance and investor relations.
        </p>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          See <Link href="/about" className="text-primary-600 hover:underline dark:text-primary-400">About</Link> for more on ARC.
        </p>
      </div>
      <p className="mt-8">
        <Link href="/" className="text-primary-600 hover:underline dark:text-primary-400">← Back to home</Link>
      </p>
    </div>
  );
}
