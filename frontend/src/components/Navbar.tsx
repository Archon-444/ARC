'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { WalletManagementModal } from '@/components/circle/WalletManagementModal';
import { CreateWalletModal } from '@/components/circle/CreateWalletModal';
import { truncateAddress } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, currentWallet, wallets } = useCircleWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const navLinks = [
    { href: '/', label: 'Explore' },
    { href: '/collections', label: 'Collections' },
    { href: '/staking', label: 'Staking' },
    { href: '/governance', label: 'Governance' },
    { href: '/studio', label: 'Create' },
  ];

  return (
    <nav className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-secondary-900 dark:text-white">
              ArcMarket
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-secondary-600 hover:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Connect Wallet Buttons */}
          <div className="flex items-center space-x-3">
            {/* Circle Wallet Button */}
            {isAuthenticated && currentWallet ? (
              <button
                onClick={() => setShowWalletModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">{truncateAddress(currentWallet.address as `0x${string}`)}</span>
                <span className="sm:hidden">Circle</span>
              </button>
            ) : (
              <button
                onClick={() => wallets.length > 0 ? setShowWalletModal(true) : setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Circle Wallet</span>
              </button>
            )}

            {/* RainbowKit Connect Button */}
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-secondary-200 dark:border-secondary-700">
        <div className="px-2 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                pathname === link.href
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-secondary-600 hover:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Circle Wallet Modals */}
      <WalletManagementModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      <CreateWalletModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </nav>
  );
}
