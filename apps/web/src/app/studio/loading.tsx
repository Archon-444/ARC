import { Skeleton } from '@/components/ui/Skeleton';

export default function StudioLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-5 w-1/2" />
        <div className="grid grid-cols-1 gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card space-y-3 p-6">
              <Skeleton className="h-8 w-8" variant="rectangular" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    </div>
  );
}
