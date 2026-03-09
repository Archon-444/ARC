import { Skeleton } from '@/components/ui/Skeleton';

export default function RewardsLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Hero section */}
      <div className="mb-8 space-y-4 text-center">
        <Skeleton className="mx-auto h-10 w-1/3" />
        <Skeleton className="mx-auto h-5 w-1/2" />
      </div>
      {/* Rewards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card space-y-4 p-6">
            <Skeleton className="h-12 w-12" variant="circular" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
