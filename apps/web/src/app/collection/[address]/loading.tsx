import { Skeleton, SkeletonGrid } from '@/components/ui/Skeleton';

export default function CollectionAddressLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <SkeletonGrid count={12} />
    </div>
  );
}
