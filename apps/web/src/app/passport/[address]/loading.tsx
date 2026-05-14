import { Skeleton } from '@/components/ui';

export default function PassportLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-9 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-6 h-32 w-full" />
      <Skeleton className="mt-4 h-40 w-full" />
    </main>
  );
}
