'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { User, Wallet } from 'lucide-react';

export default function ProfileIndexPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    // If wallet is connected, redirect to the user's profile page
    if (isConnected && address) {
      router.replace(`/profile/${address}`);
    }
  }, [isConnected, address, router]);

  // Show loading while checking connection or redirecting
  if (isConnected && address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Show connect wallet prompt if not connected
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
          <User className="h-10 w-10 text-neutral-400" />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Connect Your Wallet
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Connect your wallet to view your profile, NFTs, and activity.
        </p>

        <div className="space-y-4">
          <Link
            href="/explore"
            className="block w-full px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition"
          >
            Explore NFTs
          </Link>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Or connect your wallet using the button in the navigation bar.
          </p>
        </div>
      </div>
    </div>
  );
}
