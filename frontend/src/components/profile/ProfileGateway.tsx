'use client';

import { useRouter } from 'next/navigation';
import { ProfileConnectionCard } from '@/components/profile/ProfileConnectionCard';
import { ProfilePreviewCards } from '@/components/profile/ProfilePreviewCards';
import { ProfileQuickActions } from '@/components/profile/ProfileQuickActions';
import { ProfileGatewaySkeleton } from '@/components/profile/ProfileGatewaySkeleton';
import { ProfileEmptyState } from '@/components/profile/ProfileEmptyState';
import { QuickAction } from '@/lib/profile';
import { UseProfileGatewayResult } from '@/hooks/useProfileGateway';

type Props = UseProfileGatewayResult;

export function ProfileGateway({
  state,
  walletAddress,
  snapshot,
  connectWallet,
  openMyProfileHref,
}: Props) {
  const router = useRouter();

  if (state === 'loading' || state === 'switching') {
    return <ProfileGatewaySkeleton showPreviewCards />;
  }

  const actions: QuickAction[] = [
    { key: 'rewards', label: 'Rewards', href: '/rewards' },
    { key: 'settings', label: 'Settings', href: '/settings' },
    state === 'disconnected'
      ? { key: 'explore', label: 'Explore', href: '/explore' }
      : { key: 'profile', label: 'My profile', href: openMyProfileHref },
    { key: 'launch', label: 'Launch', href: '/launch' },
  ];

  return (
    <main className="min-h-screen px-4 py-10 lg:px-6 lg:py-14" data-testid="profile-gateway-page">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Your ARC account
            </h1>
            <p className="mt-4 max-w-3xl text-base text-neutral-600 dark:text-neutral-400 lg:text-lg">
              Track holdings, listings, rewards, and wallet activity in one place.
            </p>
          </div>

          <ProfileConnectionCard
            state={state}
            walletAddress={walletAddress}
            onConnect={connectWallet}
            onContinue={() => {
              if (openMyProfileHref) router.push(openMyProfileHref);
            }}
          />
        </section>

        <ProfileQuickActions actions={actions} />

        {state === 'empty' ? (
          <ProfileEmptyState
            onExplore={() => router.push('/explore')}
            onCreate={() => router.push('/launch')}
            onRewards={() => router.push('/rewards')}
          />
        ) : (
          <ProfilePreviewCards snapshot={snapshot} />
        )}
      </div>
    </main>
  );
}
