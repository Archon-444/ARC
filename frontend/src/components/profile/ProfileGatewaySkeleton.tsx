'use client';

type Props = {
  showPreviewCards?: boolean;
};

export function ProfileGatewaySkeleton({ showPreviewCards = true }: Props) {
  return (
    <main className="min-h-screen px-4 py-10 lg:px-6 lg:py-14" data-testid="profile-gateway-skeleton">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div className="space-y-3">
            <div className="h-6 w-32 rounded-full bg-neutral-200/80 dark:bg-white/10" />
            <div className="h-12 w-72 rounded-2xl bg-neutral-200/80 dark:bg-white/10" />
            <div className="h-5 w-full max-w-2xl rounded-xl bg-neutral-200/60 dark:bg-white/5" />
            <div className="h-5 w-2/3 rounded-xl bg-neutral-200/60 dark:bg-white/5" />
          </div>
          <div className="h-48 rounded-3xl bg-neutral-200/70 dark:bg-white/5" />
        </section>

        {showPreviewCards && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 rounded-3xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
