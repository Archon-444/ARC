'use client';

type Props = {
  onExplore: () => void;
  onCreate: () => void;
  onRewards: () => void;
};

export function ProfileEmptyState({ onExplore, onCreate, onRewards }: Props) {
  return (
    <section
      className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50/70 p-6 dark:border-white/10 dark:bg-slate-950/60"
      data-testid="profile-empty-state"
    >
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Your account is ready</h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Start building your ARC profile by exploring markets, opening rewards, or creating your first listing.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={onExplore} className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black">
          Explore
        </button>
        <button type="button" onClick={onRewards} className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
          Rewards
        </button>
        <button type="button" onClick={onCreate} className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-white">
          Create / list
        </button>
      </div>
    </section>
  );
}
