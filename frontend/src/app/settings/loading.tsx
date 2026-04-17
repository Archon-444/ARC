import { Skeleton } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
      <Skeleton className="h-10 w-1/4" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card space-y-2 p-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
