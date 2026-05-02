import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';

const DOCS_SECTION_KEY = '__docs__';
// Collapse all /docs/* and /dev-docs/* routes onto a single animation key so
// navigating between docs sub-routes does not remount the nested DocsLayout.
// Everything else keys on full pathname for the per-page fade.
const deriveAnimationKey = (pathname: string) => {
  if (/^\/(dev-)?docs(\/|$)/.test(pathname)) return DOCS_SECTION_KEY;
  return pathname;
};

export const Layout = () => {
  const location = useLocation();
  const animationKey = deriveAnimationKey(location.pathname);

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={animationKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};
