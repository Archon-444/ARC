import { SkeletonGrid } from '@/components/ui/Skeleton';

export default function ExploreLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <SkeletonGrid count={8} />
    </div>
  );
}
