import { useParams, Navigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { DocsContent } from '@/components/docs/DocsContent';
import { getDocBySlug } from '@/config/docs';
import { TOOLS } from '@/config/tools';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const DocsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const doc = slug ? getDocBySlug(slug) : undefined;

  if (!doc) {
    return <Navigate to="/docs" replace />;
  }

  const linkedTool = doc.toolId ? TOOLS[doc.toolId] : undefined;

  return (
    <Layout>
      <Helmet>
        <title>{doc.title} - EsyDocs Docs</title>
        <meta name="description" content={doc.description} />
      </Helmet>
      <div className="container py-8 md:py-12">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <DocsSidebar />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 max-w-3xl">
            {/* Mobile sidebar trigger */}
            <div className="lg:hidden mb-6">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Menu className="w-4 h-4" />
                    Browse docs
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="pt-12 px-4">
                    <DocsSidebar onNavigate={() => setSidebarOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Doc header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
              <p className="text-lg text-muted-foreground">{doc.description}</p>
              {linkedTool && (
                <Link
                  to={linkedTool.route}
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary hover:underline"
                >
                  Try {linkedTool.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Doc body */}
            <DocsContent sections={doc.sections} />
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default DocsPage;
