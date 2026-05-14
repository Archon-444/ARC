'use client';

import Link from 'next/link';
import {
  Hexagon,
  ShieldCheck,
  Plug,
  FileSignature,
  IdCard,
  Users,
  BookOpen,
  Archive,
  User,
  Settings,
  FileText,
  Shield,
  Info,
  Mail,
} from 'lucide-react';

const footerSections = [
  {
    title: 'Trust surface',
    links: [
      { label: 'Trust read', href: '/trust/0x1234567890abcdef1234567890abcdef12345678', icon: ShieldCheck },
      { label: 'Passport lookup', href: '/passport/0x1234567890abcdef1234567890abcdef12345678', icon: IdCard },
      { label: 'Agents', href: '/agents', icon: Users },
      { label: 'Docs', href: '/docs', icon: BookOpen },
    ],
  },
  {
    title: 'Integrate',
    links: [
      { label: 'MCP server', href: '/docs', icon: Plug },
      { label: 'Attestation schemas', href: '/docs', icon: FileSignature },
      { label: 'Legacy primitives', href: '/legacy', icon: Archive },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Profile', href: '/profile', icon: User },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
  {
    title: 'Legal & company',
    links: [
      { label: 'Terms of Service', href: '/terms', icon: FileText },
      { label: 'Privacy Policy', href: '/privacy', icon: Shield },
      { label: 'About', href: '/about', icon: Info },
      { label: 'Contact', href: '/contact', icon: Mail },
    ],
  },
];

const shellRoutes = [
  { label: 'Docs', href: '/docs' },
  { label: 'Agents', href: '/agents' },
  { label: 'Legacy', href: '/legacy' },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200/60 bg-white/85 py-14 backdrop-blur-md dark:border-gray-800 dark:bg-background-dark/85">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                <Hexagon className="h-3.5 w-3.5" />
                Trust layer
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                Trust, identity, and editorial verification for Circle-native agent commerce.
              </h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Distributed via MCP. Monetised via x402. Anchored by ARC Passport. The marketplace
                and token launcher remain deployed as preserved primitives — see{' '}
                <Link href="/legacy" className="underline">
                  /legacy
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {shellRoutes.map((route) => (
                <Link
                  key={route.label}
                  href={route.href}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-200 dark:hover:text-primary-300"
                >
                  {route.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.7fr_0.7fr_0.7fr_0.7fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25">
                <Hexagon className="h-5 w-5 fill-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">ARC</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Trust layer for agent commerce
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
              ARC is the independent trust, identity, and editorial-verification overlay Circle
              Agent Stack and Coinbase x402 Bazaar do not provide. ERC-8004-aligned (DRAFT, via
              adapter), MENA institutional posture, counsel-led.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                MCP-distributed
              </span>
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                x402-monetised
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                ERC-8004 adapter
              </span>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="group flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-primary-500 dark:text-gray-300 dark:hover:text-primary-400"
                    >
                      <Icon className="h-4 w-4 opacity-70 transition-opacity group-hover:opacity-100" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-gray-200/70 px-4 pt-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} ARC. Trust, identity, and editorial-verification layer for
        Circle-native agent commerce.
      </div>
    </footer>
  );
}
