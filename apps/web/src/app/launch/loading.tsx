import { Skeleton } from '@/components/ui/Skeleton';

export default function LaunchLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
        <div className="space-y-4 pt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-1/3" />
        </div>
      </div>
    </div>
  );
}
