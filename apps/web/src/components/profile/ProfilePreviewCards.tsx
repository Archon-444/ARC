'use client';

import { BarChart3, Trophy, Wallet, Sparkles } from 'lucide-react';
import { ProfileSnapshot } from '@/lib/profile';

type Props = {
  snapshot?: ProfileSnapshot;
  isLoading?: boolean;
  isEmpty?: boolean;
};

export function ProfilePreviewCards({ snapshot, isLoading, isEmpty }: Props) {
  const cards = [
    {
      label: 'Holdings',
      value: isLoading ? '—' : String(snapshot?.holdingsCount ?? 0),
      hint: isEmpty ? 'No wallet-held items yet.' : 'Wallet inventory across ARC surfaces.',
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: 'Listings',
      value: isLoading ? '—' : String(snapshot?.listingsCount ?? 0),
      hint: isEmpty ? 'No active sell-side activity yet.' : 'Track what is live and listed.',
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      label: 'Activity',
      value: isLoading ? '—' : String(snapshot?.activityCount ?? 0),
      hint: isEmpty ? 'No marketplace events yet.' : 'Review purchases, sales, and wallet movement.',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: 'Rewards',
      value: isLoading ? '—' : String(snapshot?.rewardsCount ?? 0),
      hint: 'Keep progression and rewards attached to your account journey.',
      icon: <Trophy className="h-4 w-4" />,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="profile-preview-cards">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-neutral-200/60 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
            {card.icon}
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">{card.label}</div>
          <div className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{card.value}</div>
          <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{card.hint}</div>
        </div>
      ))}
    </section>
  );
}
