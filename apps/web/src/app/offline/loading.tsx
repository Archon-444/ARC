import { Skeleton } from '@/components/ui/Skeleton';

export default function OfflineLoading() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-16 space-y-4 text-center">
      <Skeleton className="mx-auto h-16 w-16" variant="circular" />
      <Skeleton className="mx-auto h-8 w-2/3" />
      <Skeleton className="mx-auto h-5 w-1/2" />
    </div>
  );
}
