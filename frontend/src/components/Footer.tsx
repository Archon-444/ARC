import Link from 'next/link';
import { Hexagon, ArrowUpRight, Rocket, Search, Sparkles, ShieldCheck, BarChart3, Trophy, User } from 'lucide-react';

const footerSections = [
  {
    title: 'Platform',
    links: [
      { label: 'Explore', href: '/explore', icon: Search },
      { label: 'Launch', href: '/launch', icon: Rocket },
      { label: 'Studio', href: '/studio', icon: Sparkles },
      { label: 'Stats', href: '/stats', icon: BarChart3 },
    ],
  },
  {
    title: 'Discovery',
    links: [
      { label: 'All inventory', href: '/explore?tab=all', icon: Search },
      { label: 'Auctions', href: '/explore?tab=auctions', icon: ArrowUpRight },
      { label: 'Token markets', href: '/explore?tab=tokens', icon: Rocket },
      { label: 'Rewards', href: '/rewards', icon: Trophy },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Profile', href: '/profile', icon: User },
      { label: 'Settings', href: '/settings', icon: ShieldCheck },
      { label: 'Connect wallet', href: '/profile', icon: ShieldCheck },
      { label: 'Launch again', href: '/launch', icon: Rocket },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200/60 bg-white/85 py-14 backdrop-blur-md dark:border-gray-800 dark:bg-background-dark/85">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr_0.85fr_0.85fr] lg:px-8">
        <div className="max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/25">
              <Hexagon className="h-5 w-5 fill-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">ARC</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Marketplace, launchpad, and token discovery</div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400">
            ARC unifies marketplace discovery, token launches, and wallet-native market activity into one premium on-chain platform.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              Marketplace inventory
            </span>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
              Token launches
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              Wallet-native flows
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

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-gray-200/70 px-4 pt-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>© {new Date().getFullYear()} ARC. Built for marketplace discovery, token launches, and live on-chain trading workflows.</div>
        <div className="flex flex-wrap gap-4">
          <Link href="/explore" className="transition-colors hover:text-primary-500">Explore</Link>
          <Link href="/launch" className="transition-colors hover:text-primary-500">Launch</Link>
          <Link href="/studio" className="transition-colors hover:text-primary-500">Studio</Link>
          <Link href="/stats" className="transition-colors hover:text-primary-500">Stats</Link>
        </div>
      </div>
    </footer>
  );
}
