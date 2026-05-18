import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { useEmbedMode } from '@/hooks/useEmbedMode';

export const Layout = () => {
  // Embed mode (`?embed=1`): hide the global chrome so the
  // hosted editor renders edge-to-edge inside a partner's
  // `<fyredocs-editor>` iframe. The wire contract is documented
  // in sdks/embed/README.md.
  const isEmbed = useEmbedMode();

  if (isEmbed) {
    return (
      <div className="min-h-screen flex flex-col">
        <main id="main-content" className="flex-1 flex flex-col">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1 flex flex-col bg-gradient-hero">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};
