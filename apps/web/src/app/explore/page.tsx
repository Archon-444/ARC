import { Suspense } from 'react';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import ExploreContent from '@/components/explore/ExploreContent';

export default function ExplorePage() {
  return (
    <Suspense fallback={<LoadingPage label="Loading Explore..." />}>
      <ExploreContent />
    </Suspense>
  );
}
