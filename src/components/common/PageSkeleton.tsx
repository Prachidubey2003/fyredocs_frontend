import { Skeleton } from '@/components/ui/skeleton';

export const PageSkeleton = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="w-20 h-5 hidden sm:block" />
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-24 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-16 h-9 rounded-md hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <main className="flex-1 container py-12">
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
      </main>
    </div>
  );
};
