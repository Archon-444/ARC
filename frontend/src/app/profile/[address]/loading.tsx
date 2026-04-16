import { Skeleton, SkeletonGrid } from '@/components/ui/Skeleton';

export default function ProfileAddressLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20" variant="circular" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <SkeletonGrid count={8} />
    </div>
  );
}
