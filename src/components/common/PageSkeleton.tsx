import { Skeleton } from '@/components/ui/skeleton';

// Content-only skeleton. Slots into Layout's <main> while the real Header
// stays mounted above it, so navigation between lazy-loaded routes does not
// flash a fake header.
export const PageSkeleton = () => {
  return (
    <div className="flex-1 container py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="w-2/3 h-10 mx-auto" />
        <Skeleton className="w-full h-5 mx-auto" />
        <Skeleton className="w-4/5 h-5 mx-auto" />
        <div className="pt-8 space-y-4">
          <Skeleton className="w-full h-48 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
