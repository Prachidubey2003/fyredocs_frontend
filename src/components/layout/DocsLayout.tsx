import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/useAuth';

export type DocsTab = 'features' | 'api' | 'architecture';

interface DocsLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  activeTab?: DocsTab;
}

const tabs: { id: DocsTab; label: string; href: string }[] = [
  { id: 'features', label: 'Features', href: '/docs' },
  { id: 'api', label: 'API', href: '/dev-docs/api-auth' },
  { id: 'architecture', label: 'Architecture', href: '/dev-docs/architecture' },
];

export const DocsLayout = ({ sidebar, children, activeTab }: DocsLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isSuperAdmin = user?.role === 'super-admin';

  // Determine active tab from prop or route
  const currentTab: DocsTab =
    activeTab ?? (location.pathname.startsWith('/dev-docs') ? 'architecture' : 'features');

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Header />

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

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-muted/50 border-r border-border">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            {sidebar}
          </div>
        </aside>

        {/* Mobile sidebar trigger */}
        <div className="lg:hidden fixed bottom-4 left-4 z-50">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full shadow-lg">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-muted/50 border-border">
              <div className="pt-12 px-2">
                {sidebar}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main content area */}
        <main id="main-content" className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
