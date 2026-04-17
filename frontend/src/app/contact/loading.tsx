import { Skeleton } from '@/components/ui/Skeleton';

export default function ContactLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
