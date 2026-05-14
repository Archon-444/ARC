import { Skeleton } from '@/components/ui/Skeleton';

export default function NFTDetailLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
