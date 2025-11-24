'use client';

import { useMemo, useState } from 'react';
import { SearchInput } from '@/components/search/SearchInput';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { XPDisplay } from '@/components/gamification/XPDisplay';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Bell, ChevronDown, CircleDollarSign, Compass, Menu, Search, ShoppingCart, Sparkles, User } from 'lucide-react';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { WalletManagementModal } from '@/components/circle/WalletManagementModal';
import { CreateWalletModal } from '@/components/circle/CreateWalletModal';
import { truncateAddress } from '@/lib/utils';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { ThemeToggle } from '@/components/ThemeToggle';

const primaryNav = [
  { label: 'Explore', href: '/explore' },
  { label: 'Stats', href: '/stats' },
  { label: 'Rewards', href: '/rewards' },
  { label: 'Create', href: '/studio', accent: true },
];

const exploreSections = [
  {
    title: 'Collections',
    links: [
      { label: 'Trending Today', href: '/explore?sort=trending', meta: '+42% volume' },
      { label: 'New & Notable', href: '/explore?filter=new', meta: 'Curated drops' },
      { label: 'Verified', href: '/explore?filter=verified', meta: 'Trusted creators' },
    ],
  },
  {
    title: 'Categories',
    links: [
      { label: 'Art', href: '/explore?category=art', meta: '24k items' },
      { label: 'Gaming', href: '/explore?category=gaming', meta: '12k items' },
      { label: 'Music', href: '/explore?category=music', meta: '4.5k items' },
      { label: 'Photography', href: '/explore?category=photography', meta: '1.8k items' },
    ],
  },
];

const mobileNav = [
  { label: 'Home', href: '/', icon: <Compass className="h-5 w-5" /> },
  { label: 'Explore', href: '/explore', icon: <Search className="h-5 w-5" /> },
  { label: 'Create', href: '/studio', icon: <Sparkles className="h-5 w-5" /> },
  { label: 'Activity', href: '/activity', icon: <Bell className="h-5 w-5" /> },
  { label: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const { isConnected, activeWallet, wallets, createWallet, loading } = useCircleWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  const loyaltyTier = useMemo(() => ({ tier: 'Silver', progress: 52, xp: 2450 }), []);

  const handleCircleWalletClick = async () => {
    if (isConnected && wallets.length > 0) {
      setShowWalletModal(true);
    } else if (isConnected && wallets.length === 0) {
      setShowCreateModal(true);
    } else {
      try {
        await createWallet();
        setShowCreateModal(true);
      } catch (error) {
        console.error('Failed to create Circle user:', error);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/80 backdrop-blur-xl transition dark:border-neutral-800 dark:bg-neutral-950/70">
      <div className="container-custom flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">ArcMarket</p>
              <p className="text-xs uppercase tracking-wider text-neutral-500">OS2-Level Experience</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-2">
            <div
              className="relative"
              onMouseEnter={() => setExploreOpen(true)}
              onMouseLeave={() => setExploreOpen(false)}
            >
              <button className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${exploreOpen ? 'bg-neutral-900 text-white dark:bg-white/10 dark:text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
                }`}>
                Explore
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={`absolute left-0 top-full mt-3 w-[520px] rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-2xl transition duration-200 dark:border-neutral-800 dark:bg-neutral-900 ${exploreOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                  }`}
              >
                <div className="grid grid-cols-2 gap-6">
                  {exploreSections.map((section) => (
                    <div key={section.title}>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">{section.title}</p>
                      <div className="mt-3 space-y-2">
                        {section.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="flex items-center justify-between rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-neutral-800 transition hover:border-primary-500 hover:bg-primary-50 dark:text-neutral-100 dark:hover:bg-primary-500/10"
                          >
                            <span>{link.label}</span>
                            <span className="text-xs text-neutral-500">{link.meta}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-semibold dark:bg-neutral-800">
                  <span>Live activity feed</span>
                  <button className="text-primary-600">View all →</button>
                </div>
              </div>
            </div>

            {primaryNav.filter((item) => item.label !== 'Explore').map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${pathname.startsWith(item.href)
                  ? 'bg-neutral-900 text-white dark:bg-primary-500 dark:text-white'
                  : item.accent
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={open}
            className="hidden md:flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <Search className="h-4 w-4" />
            Search
            <span className="text-xs text-neutral-400">⌘K</span>
          </button>

          <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <span className="text-sm font-bold text-neutral-900 dark:text-white">{loyaltyTier.tier}</span>
            <div className="h-1 w-24 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500" style={{ width: `${loyaltyTier.progress}%` }} />
            </div>
            <span>{loyaltyTier.xp} XP</span>
          </div>

          <button className="relative rounded-full border border-neutral-200/80 bg-white p-2 text-neutral-500 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">2</span>
          </button>

          <ThemeToggle />

          <button className="rounded-full border border-neutral-200/80 bg-white p-2 text-neutral-500 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <Bell className="h-5 w-5" />
          </button>

          {isConnected && activeWallet ? (
            <button
              onClick={() => setShowWalletModal(true)}
              className="hidden lg:inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-lg"
            >
              <CircleDollarSign className="h-4 w-4" />
              {truncateAddress(activeWallet.address as `0x${string}`)}
            </button>
          ) : (
            <button
              onClick={handleCircleWalletClick}
              disabled={loading}
              className="hidden lg:inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <CircleDollarSign className="h-4 w-4" />
              {loading ? 'Connecting...' : 'Circle Wallet'}
            </button>
          )}

          <div className="hidden lg:block">
            <ConnectButton />
          </div>

          <button className="lg:hidden rounded-full border border-neutral-200 p-2 text-neutral-600 dark:border-neutral-700 dark:text-neutral-200">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile sticky nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/70 bg-white/90 backdrop-blur-md shadow-2xl dark:border-neutral-800 dark:bg-neutral-950/70 lg:hidden">
        <div className="grid grid-cols-5 text-sm">
          {mobileNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex w-full flex-col items-center justify-center gap-1 py-3 text-xs font-semibold transition-colors active:bg-neutral-100 dark:active:bg-neutral-800 ${pathname === item.href
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <WalletManagementModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      <CreateWalletModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />
    </header>
  );
}
