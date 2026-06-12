import { Suspense, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Menu, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/useAuth';
import { docNavGroups } from '@/config/docs';
import { devDocNavGroups } from '@/config/developerDocs';
import { flattenNav } from '@/lib/docsNavigation';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DevDocsSidebar } from '@/components/docs/DevDocsSidebar';
import { DocsSearch } from '@/components/docs/DocsSearch';
import { PageSkeleton } from '@/components/common/PageSkeleton';

export type DocsTab = 'features' | 'api' | 'architecture';

const tabs: { id: DocsTab; label: string; href: string }[] = [
  { id: 'features', label: 'Features', href: '/docs' },
  { id: 'api', label: 'API', href: '/dev-docs/api-auth' },
  { id: 'architecture', label: 'Architecture', href: '/dev-docs/architecture' },
];

const deriveTab = (pathname: string): DocsTab => {
  if (pathname.startsWith('/dev-docs/api')) return 'api';
  if (pathname.startsWith('/dev-docs')) return 'architecture';
  return 'features';
};

export const DocsLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isSuperAdmin = user?.role === 'super-admin';
  const currentTab = deriveTab(location.pathname);
  const isDevDocs = location.pathname.startsWith('/dev-docs');

  const renderSidebar = (onNavigate?: () => void) =>
    isDevDocs ? (
      <DevDocsSidebar filter={currentTab === 'api' ? 'api' : 'architecture'} onNavigate={onNavigate} />
    ) : (
      <DocsSidebar onNavigate={onNavigate} />
    );

  // Breadcrumb: Docs / current group / current title — derived from the URL slug.
  const breadcrumb = useMemo(() => {
    const root = isDevDocs
      ? { label: 'Developer Docs', href: '/dev-docs' }
      : { label: 'Docs', href: '/docs' };
    const slug = location.pathname.split('/')[2];
    const current = slug
      ? flattenNav(isDevDocs ? devDocNavGroups : docNavGroups).find((item) => item.slug === slug)
      : undefined;
    return { root, current };
  }, [location.pathname, isDevDocs]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Tab bar — only visible for super-admin */}
      {isSuperAdmin && (
        <div className="border-b bg-background">
          <div className="flex items-center gap-0 px-4">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.href}
                className={cn(
                  'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                  currentTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Slim docs top bar: mobile nav trigger, breadcrumb, search */}
      <div className="border-b bg-background">
        <div className="flex h-12 items-center gap-3 px-4 lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden -ml-2 h-8 w-8"
                aria-label="Open docs navigation"
              >
                <Menu className="w-5 h-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-muted/50 border-border">
              <div className="pt-12 px-2 h-full">
                {/* Close the sheet when a doc link is tapped */}
                {renderSidebar(() => setSidebarOpen(false))}
              </div>
            </SheetContent>
          </Sheet>

          <Breadcrumb className="min-w-0 flex-1">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={breadcrumb.root.href}>{breadcrumb.root.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumb.current && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem className="hidden sm:inline-flex">
                    <span className="text-muted-foreground">{breadcrumb.current.group}</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:block" />
                  <BreadcrumbItem className="min-w-0">
                    <BreadcrumbPage className="truncate">{breadcrumb.current.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-8 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Search className="w-3.5 h-3.5" aria-hidden />
            <span className="hidden sm:inline">Search docs…</span>
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              /
            </kbd>
            <span className="sr-only sm:hidden">Search docs</span>
          </button>
        </div>
      </div>

      <DocsSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-muted/50 border-r border-border">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            {renderSidebar()}
          </div>
        </aside>

        {/* Main content area — doc pages render their own ToC right rail on xl */}
        <main className="flex-1 min-w-0">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
