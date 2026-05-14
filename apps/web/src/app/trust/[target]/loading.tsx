import { Skeleton } from '@/components/ui';

export default function TrustLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-9 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </main>
  );
}
