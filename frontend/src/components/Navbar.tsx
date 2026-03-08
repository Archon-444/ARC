'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  BarChart3,
  Bell,
  ChevronDown,
  CircleDollarSign,
  Compass,
  Hexagon,
  LogOut,
  Menu,
  Rocket,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Trophy,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { CreateWalletModal } from '@/components/circle/CreateWalletModal';
import { WalletManagementModal } from '@/components/circle/WalletManagementModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { truncateAddress } from '@/lib/utils';

const primaryNav = [
  { label: 'Explore', href: '/explore', hasDropdown: true },
  { label: 'Launchpad', href: '/launch' },
  { label: 'Studio', href: '/studio' },
  { label: 'Stats', href: '/stats' },
  { label: 'Rewards', href: '/rewards' },
];

const exploreSections = [
  {
    title: 'Explore',
    links: [
      { label: 'All inventory', href: '/explore?tab=all' },
      { label: 'Listings', href: '/explore?tab=listings' },
      { label: 'Auctions', href: '/explore?tab=auctions' },
      { label: 'Token markets', href: '/explore?tab=tokens' },
    ],
  },
];

const mobileNav = [
  { label: 'Explore', href: '/explore', icon: <Compass className="h-5 w-5" /> },
  { label: 'Launchpad', href: '/launch', icon: <Rocket className="h-5 w-5" /> },
  { label: 'Studio', href: '/studio', icon: <Sparkles className="h-5 w-5" /> },
  { label: 'Stats', href: '/stats', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Rewards', href: '/rewards', icon: <Trophy className="h-5 w-5" /> },
];

const mobileUtilityLinks = [
  { label: 'Home', href: '/' },
  { label: 'Profile', href: '/profile' },
  { label: 'Settings', href: '/settings' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const {
    isConnected,
    currentWallet: activeWallet,
    wallets,
    createWallet,
    isLoading: loading,
    disconnectWallet,
  } = useCircleWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const loyaltyTier = useMemo(() => {
    if (!isConnected) return null;
    return null;
  }, [isConnected]);
  const cartCount = 0;

  const shellContext = useMemo(() => {
    if (pathname.startsWith('/launch')) {
      return {
        title: 'Launchpad active',
        description: 'Create and route new token launches into live ARC market pages.',
      };
    }
    if (pathname.startsWith('/stats')) {
      return {
        title: 'Analytics active',
        description: 'Review ARC signals, then route back into discovery or creator workflows.',
      };
    }
    if (pathname.startsWith('/rewards')) {
      return {
        title: 'Rewards active',
        description: 'Track loyalty and participation while staying connected to the ARC shell.',
      };
    }
    if (pathname.startsWith('/explore')) {
      return {
        title: 'Explore active',
        description: 'Browse inventory and token markets from the primary discovery surface.',
      };
    }
    if (pathname.startsWith('/token/')) {
      return {
        title: 'Token market active',
        description: 'Trade launched tokens and return quickly to discovery or analytics.',
      };
    }
    if (pathname.startsWith('/studio')) {
      return {
        title: 'Studio active',
        description: 'Build inside ARC with the same shell used across discovery and market routes.',
      };
    }
    if (pathname.startsWith('/profile')) {
      return {
        title: 'Profile active',
        description: 'Account tools stay in the utility area so primary navigation remains focused.',
      };
    }
    return {
      title: 'ARC shell active',
      description: 'One primary navigation for core destinations, plus one utility area for account actions.',
    };
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setWalletMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setWalletMenuOpen(false);
  };

  const isWalletConnected = isConnected && activeWallet;

  const isNavActive = (href: string) => {
    if (href === '/explore') return pathname.startsWith('/explore') || pathname.startsWith('/token/');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-white/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-background-dark/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30">
              <Hexagon className="h-4 w-4 fill-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-neutral-900 dark:text-white">ARC</span>
              <div className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400 lg:block">
                Connected shell
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setExploreOpen(true)}
              onMouseLeave={() => setExploreOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  exploreOpen || isNavActive('/explore')
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                Explore
                <ChevronDown className={`h-4 w-4 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
              </button>

              <div
                className={`absolute left-0 top-full pt-2 transition-all duration-150 ${
                  exploreOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <div className="w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                  {exploreSections.map((section, idx) => (
                    <div
                      key={section.title}
                      className={idx > 0 ? 'mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800' : ''}
                    >
                      <p className="px-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                        {section.title}
                      </p>
                      <div className="mt-1.5 space-y-0.5">
                        {section.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="block rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {primaryNav
              .filter((item) => item.label !== 'Explore')
              .map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isNavActive(item.href)
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden items-center lg:flex">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              onClick={open}
              onFocus={open}
              readOnly
              className="w-64 cursor-pointer rounded-full bg-gray-100 py-2 pl-10 pr-16 text-sm text-gray-700 outline-none placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:bg-surface-dark dark:text-gray-200"
              placeholder="Search ARC markets, collections, users..."
            />
            <kbd className="absolute right-3 rounded border border-gray-300 px-1.5 py-0.5 font-mono text-xs text-gray-500 dark:border-gray-600">⌘K</kbd>
          </div>

          <button
            onClick={open}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 lg:hidden"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-500 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <ThemeToggle />

          <div className="relative hidden lg:block" ref={walletMenuRef}>
            <button
              onClick={() => setWalletMenuOpen(!walletMenuOpen)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isWalletConnected
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600'
                  : 'border border-gray-300 bg-white hover:border-primary-500 dark:border-gray-700 dark:bg-surface-dark'
              }`}
            >
              <Wallet className="h-4 w-4" />
              {isWalletConnected ? truncateAddress(activeWallet.address as `0x${string}`) : 'Connect Wallet'}
            </button>

            {walletMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                {isWalletConnected ? (
                  <>
                    <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">Connected</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                        {truncateAddress(activeWallet.address as `0x${string}`)}
                      </p>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <button
                        onClick={() => {
                          setShowWalletModal(true);
                          setWalletMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        <CircleDollarSign className="h-4 w-4" />
                        Manage Wallets
                      </button>
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setWalletMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={handleCircleWalletClick}
                      disabled={loading}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <CircleDollarSign className="h-4 w-4" />
                      {loading ? 'Connecting...' : 'Circle Wallet'}
                    </button>
                    <div className="relative">
                      <div className="absolute inset-x-0 top-0 flex items-center justify-center">
                        <span className="bg-white px-2 text-xs text-neutral-400 dark:bg-neutral-900">or</span>
                      </div>
                      <div className="my-2 border-t border-neutral-100 dark:border-neutral-800" />
                    </div>
                    <div className="[&>div]:w-full [&_button]:w-full [&_button]:justify-center">
                      <ConnectButton.Custom>
                        {({ openConnectModal }) => (
                          <button
                            onClick={openConnectModal}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                          >
                            <Wallet className="h-4 w-4" />
                            External Wallet
                          </button>
                        )}
                      </ConnectButton.Custom>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative hidden lg:block" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 ring-2 ring-transparent transition-all hover:ring-primary-500"
              aria-label="Profile"
            />

            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                  {loyaltyTier ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {loyaltyTier.tier}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-500">{loyaltyTier.xp} XP</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500"
                          style={{ width: `${loyaltyTier.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">{loyaltyTier.progress}% to Gold</p>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-400" />
                      <span className="text-xs text-neutral-400">Account utilities and profile tools</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart className="h-4 w-4" />
                      Cart
                    </div>
                    {cartCount > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-xs font-medium text-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 lg:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="border-t border-neutral-200/60 bg-white/70 dark:border-neutral-800 dark:bg-background-dark/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 lg:px-6 lg:py-2.5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Current route</div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">{shellContext.title}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">{shellContext.description}</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 dark:border-white/10 dark:bg-slate-950/60 dark:text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Primary nav + utility split
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 shadow-lg backdrop-blur-xl dark:border-neutral-800 dark:bg-background-dark/95 lg:hidden safe-area-inset-bottom">
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                isNavActive(item.href)
                  ? 'text-primary-500'
                  : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-background-dark/95">
            <div className="space-y-6 p-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Current route</div>
                <div className="mt-1 font-semibold text-neutral-900 dark:text-white">{shellContext.title}</div>
                <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{shellContext.description}</div>
              </div>

              <div>
                <p className="px-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Primary navigation</p>
                <nav className="mt-2 space-y-1">
                  {primaryNav.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        isNavActive(item.href)
                          ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <p className="px-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Explore shortcuts</p>
                <div className="mt-2 space-y-1">
                  {exploreSections[0].links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="px-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Utility</p>
                <div className="mt-2 space-y-1">
                  {mobileUtilityLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                          ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <WalletManagementModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      <CreateWalletModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </header>
  );
}
