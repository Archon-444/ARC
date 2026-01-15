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
  Menu,
  Search,
  ShoppingCart,
  Sparkles,
  User,
  Wallet,
  LogOut,
  Settings,
  Trophy,
  X
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
  { label: 'Create', href: '/studio', accent: true },
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
  const { isConnected, activeWallet, wallets, createWallet, loading, disconnectWallet } = useCircleWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const loyaltyTier = useMemo(() => ({ tier: 'Silver', progress: 52, xp: 2450 }), []);
  const cartCount = 2;

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
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-white/95 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-10">
          {/* Logo - Simplified */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-sm">
              <Sparkles className="h-4.5 w-4.5" />
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
                    : item.accent
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button - Icon style */}
          <button
            onClick={open}
            className="hidden md:flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-neutral-300 bg-white px-1.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-600 dark:bg-neutral-700">⌘K</kbd>
          </button>

          {/* Mobile Search */}
          <button
            onClick={open}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notification Bell */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
            <Bell className="h-5 w-5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Unified Wallet Button */}
          <div className="relative hidden lg:block" ref={walletMenuRef}>
            <button
              onClick={() => setWalletMenuOpen(!walletMenuOpen)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isWalletConnected
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10'
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
                          const connected = mounted && account && chain;
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
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <User className="h-5 w-5" />
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
                {/* XP Progress */}
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
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
          <button className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-xl shadow-lg dark:border-neutral-800 dark:bg-neutral-950/95 lg:hidden safe-area-inset-bottom">
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

      {/* Modals */}
      <WalletManagementModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      <CreateWalletModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => setShowCreateModal(false)} />
    </header>
  );
}
