'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  Compass,
  Hexagon,
  Menu,
  Rocket,
  Search,
  ShoppingCart,
  User,
  Wallet,
  LogOut,
  Settings,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { WalletManagementModal } from '@/components/circle/WalletManagementModal';
import { CreateWalletModal } from '@/components/circle/CreateWalletModal';
import { truncateAddress } from '@/lib/utils';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { ThemeToggle } from '@/components/ThemeToggle';

const primaryNav = [
  { label: 'Explore', href: '/explore', hasDropdown: true },
  { label: 'Stats', href: '/stats' },
  { label: 'Rewards', href: '/rewards' },
];

const exploreSections = [
  {
    title: 'Collections',
    links: [
      { label: 'Trending', href: '/explore?sort=trending' },
      { label: 'New & Notable', href: '/explore?filter=new' },
      { label: 'Verified', href: '/explore?filter=verified' },
    ],
  },
  {
    title: 'Categories',
    links: [
      { label: 'Art', href: '/explore?category=art' },
      { label: 'Gaming', href: '/explore?category=gaming' },
      { label: 'Music', href: '/explore?category=music' },
      { label: 'Photography', href: '/explore?category=photography' },
    ],
  },
  {
    title: 'Token Launchpad',
    links: [
      { label: 'Browse Tokens', href: '/explore?tab=tokens' },
      { label: 'Launch a Token', href: '/launch' },
    ],
  },
];

const mobileNav = [
  { label: 'Home', href: '/', icon: <Compass className="h-5 w-5" /> },
  { label: 'Explore', href: '/explore', icon: <Search className="h-5 w-5" /> },
  { label: 'Launch', href: '/launch', icon: <Rocket className="h-5 w-5" /> },
  { label: 'Create', href: '/studio', icon: <Sparkles className="h-5 w-5" /> },
  { label: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const { open } = useCommandPalette();
  const { isConnected, currentWallet: activeWallet, wallets, createWallet, isLoading: loading, disconnectWallet } = useCircleWallet();
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
    // Future: fetch from loyalty API when available
    return null;
  }, [isConnected]);
  const cartCount = 0;

  // Close dropdowns when clicking outside
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-white/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-background-dark/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30">
              <Hexagon className="h-4 w-4 fill-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">ArcMarket</span>
          </Link>

          {/* Primary Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Explore Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setExploreOpen(true)}
              onMouseLeave={() => setExploreOpen(false)}
            >
              <button className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                exploreOpen
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}>
                Explore
                <ChevronDown className={`h-4 w-4 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Explore Dropdown Menu */}
              <div
                className={`absolute left-0 top-full pt-2 transition-all duration-150 ${
                  exploreOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <div className="w-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                  {exploreSections.map((section, idx) => (
                    <div key={section.title} className={idx > 0 ? 'mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800' : ''}>
                      <p className="px-2 text-xs font-medium uppercase tracking-wide text-neutral-400">{section.title}</p>
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

            {/* Other Nav Items */}
            {primaryNav.filter((item) => item.label !== 'Explore').map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/launch"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-purple-500/50 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 text-sm font-medium transition-all"
            >
              <Rocket className="h-3.5 w-3.5" /> Launch
            </Link>
            <Link
              href="/studio"
              className="px-5 py-1.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium shadow-lg shadow-primary-500/25 transition-all"
            >
              Create
            </Link>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Inline Search Input (lg+) */}
          <div className="hidden lg:flex items-center relative">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              onClick={open}
              onFocus={open}
              readOnly
              className="pl-10 pr-16 py-2 w-64 bg-gray-100 dark:bg-surface-dark rounded-full text-sm focus:ring-2 focus:ring-primary-500 placeholder-gray-500 dark:text-gray-200 cursor-pointer outline-none"
              placeholder="Search collections..."
            />
            <kbd className="absolute right-3 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-500 font-mono">⌘K</kbd>
          </div>

          {/* Mobile Search */}
          <button
            onClick={open}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notification Bell with red dot */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-primary-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Unified Wallet Button */}
          <div className="relative hidden lg:block" ref={walletMenuRef}>
            <button
              onClick={() => setWalletMenuOpen(!walletMenuOpen)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isWalletConnected
                  ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/25'
                  : 'border border-gray-300 dark:border-gray-700 hover:border-primary-500 bg-white dark:bg-surface-dark'
              }`}
            >
              <Wallet className="h-4 w-4" />
              {isWalletConnected ? truncateAddress(activeWallet.address as `0x${string}`) : 'Connect Wallet'}
            </button>

            {/* Wallet Dropdown */}
            {walletMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                {isWalletConnected ? (
                  <>
                    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs text-neutral-400 uppercase tracking-wide">Connected</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                        {truncateAddress(activeWallet.address as `0x${string}`)}
                      </p>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <button
                        onClick={() => { setShowWalletModal(true); setWalletMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                      >
                        <CircleDollarSign className="h-4 w-4" />
                        Manage Wallets
                      </button>
                      <button
                        onClick={() => { disconnectWallet(); setWalletMenuOpen(false); }}
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
                      <div className="border-t border-neutral-100 dark:border-neutral-800 my-2"></div>
                    </div>
                    <div className="[&>div]:w-full [&_button]:w-full [&_button]:justify-center">
                      <ConnectButton.Custom>
                        {({ account, chain, openConnectModal, mounted }) => {
                          const _connected = mounted && account && chain;
                          return (
                            <button
                              onClick={openConnectModal}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                            >
                              <Wallet className="h-4 w-4" />
                              External Wallet
                            </button>
                          );
                        }}
                      </ConnectButton.Custom>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Menu (contains secondary items: XP, Cart, Settings) */}
          <div className="relative hidden lg:block" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 ring-2 ring-transparent hover:ring-primary-500 transition-all"
              aria-label="Profile"
            />

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                {/* XP Progress */}
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                  {loyaltyTier ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">{loyaltyTier.tier}</span>
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
                      <Trophy className="h-4 w-4 text-neutral-400" />
                      <span className="text-xs text-neutral-400">Connect wallet to view rewards</span>
                    </div>
                  )}
                </div>

                {/* Menu Items */}
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
                    href="/rewards"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <Trophy className="h-4 w-4" />
                    Rewards
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-xl shadow-lg dark:border-neutral-800 dark:bg-background-dark/95 lg:hidden safe-area-inset-bottom">
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                pathname === item.href
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

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-background-dark/95">
            <div className="p-4 space-y-6">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>

              <nav className="space-y-1">
                {primaryNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      pathname.startsWith(item.href)
                        ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="space-y-4">
                {exploreSections.map((section) => (
                  <div key={section.title}>
                    <p className="px-4 text-xs font-medium uppercase tracking-wide text-neutral-400">
                      {section.title}
                    </p>
                    <div className="mt-2 space-y-1">
                      {section.links.map((link) => (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <WalletManagementModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      <CreateWalletModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />
    </header>
  );
}
