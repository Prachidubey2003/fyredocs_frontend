import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export const Layout = ({ children, showFooter = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1 bg-gradient-hero">
        <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1fr_2fr_1fr]">
          <div />
          <div>{children}</div>
          <div />
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};
