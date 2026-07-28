import { type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { PageSkeleton } from '@/components/common/PageSkeleton';

/** Shown while the session bootstrap is in flight, so guards never flash content. */
const LoadingState = () => <PageSkeleton />;

type GuardProps = {
  redirectTo?: string;
  children?: ReactNode;
};

/**
 * ProtectedRoute does NOT require authentication. The name is misleading and is
 * kept only because renaming it touches every route definition.
 *
 * Every tool on the platform is deliberately usable without an account — the
 * backend issues a guest token and tracks anonymous jobs itself — so this guard's
 * entire job is to wait out the initial session bootstrap before rendering. It
 * shows a skeleton while auth state is resolving and then renders regardless of
 * the outcome.
 *
 * If you need a route that actually requires a session, use RoleRoute, or add a
 * real guard. Wrapping something in this expecting it to be protected is the
 * mistake this comment exists to prevent.
 */
export const ProtectedRoute = ({ children }: GuardProps) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  return children ? <>{children}</> : <Outlet />;
};

/**
 * Keeps an already-authenticated user off the sign-in and sign-up pages,
 * redirecting them home instead. Waits for bootstrap first, or a returning user
 * with a valid cookie would see the login form flash before being redirected.
 */
export const PublicOnlyRoute = ({ redirectTo = '/', children }: GuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

type RoleRouteProps = GuardProps & {
  allowedRoles: string[];
};

/**
 * The real authorization guard, and the only thing gating /admin.
 *
 * Two distinct outcomes, deliberately different: an unauthenticated visitor is
 * sent to sign-in with `from` in location state so they land back here
 * afterwards, while an authenticated user whose role is not allowed is sent home
 * — signing in again would not help them, and bouncing them to a login form
 * would imply otherwise.
 *
 * IMPORTANT: this gates RENDERING, not delivery. The route's lazy-loaded chunk is
 * a static asset any visitor can fetch directly, so nothing inside an admin
 * bundle may be treated as secret. See the header of src/config/developerDocs.ts,
 * which is shipped in exactly that way. Server-side authorization is enforced
 * independently by the gateway and each service; this guard is UX.
 */
export const RoleRoute = ({
  allowedRoles,
  redirectTo = '/signin',
  children,
}: RoleRouteProps) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
