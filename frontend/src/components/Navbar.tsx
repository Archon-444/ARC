'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Bell,
  CircleDollarSign,
  Compass,
  FileSignature,
  Hexagon,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
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
  { label: 'Trust API', href: '/docs' },
  { label: 'Passport', href: '/passport' },
  { label: 'Agents', href: '/agents' },
  { label: 'Docs', href: '/docs' },
];

const mobileNav = [
  { label: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: 'Trust API', href: '/docs', icon: <ShieldCheck className="h-5 w-5" /> },
  { label: 'Passport', href: '/passport', icon: <FileSignature className="h-5 w-5" /> },
  { label: 'Agents', href: '/agents', icon: <Compass className="h-5 w-5" /> },
  { label: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
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
    currentWallet,
    wallets,
    createWallet,
    isLoading: loading,
    disconnectWallet,
  } = useCircleWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const walletFirstActionRef = useRef<HTMLButtonElement | null>(null);
  const profileFirstActionRef = useRef<HTMLAnchorElement | null>(null);
  const walletTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lastOpenedMenuRef = useRef<'wallet' | 'profile' | null>(null);

  const loyaltyTier = useMemo(() => {
    if (!isConnected) return null;
    return null;
  }, [isConnected]);

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
        description: 'Track loyalty and participation across launch, discovery, and rewards.',
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
        description: 'Create and manage your work; discovery and token markets stay one click away.',
      };
    }
    if (pathname.startsWith('/profile')) {
      return {
        title: 'Profile active',
        description: 'Account tools stay in the utility area so primary navigation remains focused.',
      };
    }
    return {
      title: 'Home',
      description: 'Primary navigation for Explore, Launchpad, Studio, Stats, and Rewards; account actions in the utility area.',
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

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setWalletMenuOpen(false);
        setProfileMenuOpen(false);
        const last = lastOpenedMenuRef.current;
        lastOpenedMenuRef.current = null;
        requestAnimationFrame(() => {
          if (last === 'wallet') walletTriggerRef.current?.focus();
          if (last === 'profile') profileTriggerRef.current?.focus();
        });
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    function handleOpenWalletMenu() {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileMenuOpen(true);
        return;
      }
      setWalletMenuOpen(true);
    }

    window.addEventListener('arc:open-wallet-menu', handleOpenWalletMenu as EventListener);
    return () => window.removeEventListener('arc:open-wallet-menu', handleOpenWalletMenu as EventListener);
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

  const isWalletConnected = isConnected && currentWallet;

  const isNavActive = (href: string) => {
    if (href === '/explore') return pathname.startsWith('/explore') || pathname.startsWith('/token/');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-white dark:border-neutral-800 dark:bg-background-dark lg:bg-white/95 lg:backdrop-blur-xl lg:dark:bg-background-dark/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:h-16 lg:px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30">
              <Hexagon className="h-4 w-4 fill-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-neutral-900 dark:text-white">ARC</span>
              <div className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400 lg:block">
                Trust Layer
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {primaryNav.map((item) => (
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
          </button>

          <ThemeToggle />

          <div
            className="relative hidden lg:block"
            ref={walletMenuRef}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setWalletMenuOpen(false);
                lastOpenedMenuRef.current = null;
              }
            }}
          >
            <button
              ref={walletTriggerRef}
              onClick={() => setWalletMenuOpen(!walletMenuOpen)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setWalletMenuOpen(true);
                  lastOpenedMenuRef.current = 'wallet';
                  requestAnimationFrame(() => walletFirstActionRef.current?.focus());
                }
              }}
              aria-expanded={walletMenuOpen}
              aria-haspopup="true"
              aria-controls="arc-wallet-menu"
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isWalletConnected
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600'
                  : 'border border-gray-300 bg-white hover:border-primary-500 dark:border-gray-700 dark:bg-surface-dark'
              }`}
            >
              <Wallet className="h-4 w-4" />
              {isWalletConnected ? truncateAddress(currentWallet.address as `0x${string}`) : 'Connect Wallet'}
            </button>

            {walletMenuOpen && (
              <div
                id="arc-wallet-menu"
                className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
                role="menu"
                aria-label="Wallet menu"
                onKeyDown={(e) => {
                  const menu = e.currentTarget;
                  const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
                  const currentIndex = items.indexOf(document.activeElement as HTMLElement);
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setWalletMenuOpen(false);
                    lastOpenedMenuRef.current = null;
                    requestAnimationFrame(() => walletTriggerRef.current?.focus());
                    return;
                  }
                  if (e.key === 'Home' && items.length > 0) {
                    e.preventDefault();
                    items[0].focus();
                    return;
                  }
                  if (e.key === 'End' && items.length > 0) {
                    e.preventDefault();
                    items[items.length - 1].focus();
                    return;
                  }
                  if (e.key === 'ArrowDown' && items.length > 0) {
                    e.preventDefault();
                    const nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, items.length - 1);
                    items[nextIndex].focus();
                    return;
                  }
                  if (e.key === 'ArrowUp' && items.length > 0) {
                    e.preventDefault();
                    const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                    items[prevIndex].focus();
                    return;
                  }
                  if (e.key === 'Tab' && items.length > 0) {
                    e.preventDefault();
                    if (e.shiftKey) {
                      const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                      items[prevIndex].focus();
                    } else {
                      const nextIndex = currentIndex < 0 ? 0 : currentIndex + 1 >= items.length ? 0 : currentIndex + 1;
                      items[nextIndex].focus();
                    }
                  }
                }}
              >
                {isWalletConnected ? (
                  <>
                    <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">Connected</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                        {truncateAddress(currentWallet.address as `0x${string}`)}
                      </p>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <button
                        ref={walletFirstActionRef}
                        type="button"
                        role="menuitem"
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
                        type="button"
                        role="menuitem"
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
                      ref={walletFirstActionRef}
                      type="button"
                      role="menuitem"
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
                            type="button"
                            role="menuitem"
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

          <div
            className="relative hidden lg:block"
            ref={profileMenuRef}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setProfileMenuOpen(false);
                lastOpenedMenuRef.current = null;
              }
            }}
          >
            <button
              ref={profileTriggerRef}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setProfileMenuOpen(true);
                  lastOpenedMenuRef.current = 'profile';
                  requestAnimationFrame(() => profileFirstActionRef.current?.focus());
                }
              }}
              className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 ring-2 ring-transparent transition-all hover:ring-primary-500"
              aria-label="Profile"
              aria-expanded={profileMenuOpen}
              aria-haspopup="true"
              aria-controls="arc-profile-menu"
            />

            {profileMenuOpen && (
              <div
                id="arc-profile-menu"
                className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
                role="menu"
                aria-label="Profile menu"
                onKeyDown={(e) => {
                  const menu = e.currentTarget;
                  const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
                  const currentIndex = items.indexOf(document.activeElement as HTMLElement);
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setProfileMenuOpen(false);
                    lastOpenedMenuRef.current = null;
                    requestAnimationFrame(() => profileTriggerRef.current?.focus());
                    return;
                  }
                  if (e.key === 'Home' && items.length > 0) {
                    e.preventDefault();
                    items[0].focus();
                    return;
                  }
                  if (e.key === 'End' && items.length > 0) {
                    e.preventDefault();
                    items[items.length - 1].focus();
                    return;
                  }
                  if (e.key === 'ArrowDown' && items.length > 0) {
                    e.preventDefault();
                    const nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, items.length - 1);
                    items[nextIndex].focus();
                    return;
                  }
                  if (e.key === 'ArrowUp' && items.length > 0) {
                    e.preventDefault();
                    const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                    items[prevIndex].focus();
                    return;
                  }
                  if (e.key === 'Tab' && items.length > 0) {
                    e.preventDefault();
                    if (e.shiftKey) {
                      const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
                      items[prevIndex].focus();
                    } else {
                      const nextIndex = currentIndex < 0 ? 0 : currentIndex + 1 >= items.length ? 0 : currentIndex + 1;
                      items[nextIndex].focus();
                    }
                  }
                }}
              >
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
                    ref={profileFirstActionRef}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    role="menuitem"
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

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-background-dark lg:hidden safe-bottom" aria-label="Primary navigation">
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : isNavActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary-500'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white shadow-2xl dark:bg-background-dark">
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

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Quick actions</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/docs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-3 py-2.5 text-sm font-semibold text-white"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Trust API
                  </Link>
                  <Link
                    href="/passport"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                  >
                    <FileSignature className="h-4 w-4" />
                    Passport
                  </Link>
                </div>
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

              {isConnected && currentWallet && (
                <div>
                  <p className="px-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Wallet</p>
                  <div className="mt-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowWalletModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-left text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <CircleDollarSign className="h-4 w-4" />
                      Manage Wallets
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        disconnectWallet();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-left text-base font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="px-4 text-xs font-medium uppercase tracking-wide text-neutral-400">Utility</p>
                <div className="mt-2 space-y-1">
                  {!isConnected && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleCircleWalletClick();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full rounded-lg px-4 py-3 text-left text-base font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      Connect wallet
                    </button>
                  )}
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
