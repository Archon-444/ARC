import { Skeleton } from '@/components/ui/Skeleton';

export default function PrivacyLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
      <Skeleton className="h-10 w-1/3" />
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
