import type { ReactNode } from 'react';
import Link from 'next/link';

export function ShortcutCard({ icon, title, description, href }: { icon: ReactNode; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-blue-300 hover:bg-white dark:border-white/10 dark:bg-slate-950/60 dark:hover:border-blue-500/40">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-300">
        {icon}
      </div>
      <div className="font-semibold text-neutral-900 dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
    </Link>
  );
}
