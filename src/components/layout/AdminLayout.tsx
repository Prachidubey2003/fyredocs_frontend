import { Suspense, useCallback, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { PageLoading } from '@/components/common/LoadingState';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { FilterBar } from '@/components/admin/FilterBar';
import { findAdminSection } from '@/components/admin/adminNav';
import { useRealtime } from '@/hooks/useAdminMetrics';

/** Green pulse while the realtime feed is healthy; red when it errors. */
function LiveStatusDot() {
  const { isError, dataUpdatedAt } = useRealtime();
  const label = isError
    ? 'Live updates unavailable'
    : `Live${dataUpdatedAt ? ` · updated ${new Date(dataUpdatedAt).toLocaleTimeString()}` : ''}`;

  return (
    <span className="flex items-center gap-1.5" title={label}>
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        {!isError && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2.5 w-2.5 rounded-full',
            isError ? 'bg-destructive' : 'bg-success',
          )}
        />
      </span>
      <span className="hidden text-caption text-muted-foreground sm:inline">
        {isError ? 'Offline' : 'Live'}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Route-layout shell for all /admin pages: sidebar navigation, breadcrumb
 * top bar with time range + global refresh, and an <Outlet/> for page bodies.
 * Admin pages render inside this instead of the marketing Layout.
 */
export function AdminLayout() {
  const { pathname } = useLocation();
  const section = findAdminSection(pathname);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // All admin metric hooks share the ['admin', …] query key prefix.
    queryClient.resetQueries({ queryKey: ['admin'] });
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [queryClient]);

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{section.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-3">
            <LiveStatusDot />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              aria-label="Refresh all metrics"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} aria-hidden />
            </Button>
          </div>
        </header>
        <div className="sticky top-14 z-10 flex h-12 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur">
          <FilterBar pathname={pathname} />
        </div>
        <main className="flex-1">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdminLayout;
