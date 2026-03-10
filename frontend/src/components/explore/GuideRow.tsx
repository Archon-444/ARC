export function GuideRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="font-medium text-neutral-900 dark:text-white">{title}</div>
      <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</div>
    </div>
  );
}
