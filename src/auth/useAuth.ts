import { useContext } from 'react';
import { AuthContext } from '@/auth/authContext';

/**
 * Access session state. See src/auth/authContext.tsx for the auth model.
 *
 * Throws when used outside AuthProvider rather than returning a default. A
 * default would silently render every consumer as logged-out, which looks like a
 * session bug instead of the wiring mistake it actually is.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
