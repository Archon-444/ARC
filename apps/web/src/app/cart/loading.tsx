import { Skeleton } from '@/components/ui/Skeleton';

export default function CartLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-1/4" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card flex gap-4 p-4">
          <Skeleton className="h-20 w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
