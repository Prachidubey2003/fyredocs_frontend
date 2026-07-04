import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets window scroll to the top on route (pathname) change so each new page
 * starts at the top. Skips when a hash is present to preserve in-page anchor
 * navigation (e.g. /docs#section). Renders nothing.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};
