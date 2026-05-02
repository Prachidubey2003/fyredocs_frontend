import { type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { PageSkeleton } from '@/components/common/PageSkeleton';

const LoadingState = () => <PageSkeleton />;

type GuardProps = {
  redirectTo?: string;
  children?: ReactNode;
};

// All tool pages are freely accessible — no account required.
// The backend handles anonymous requests automatically.
export const ProtectedRoute = ({ children }: GuardProps) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState />;
  }

  return children ? <>{children}</> : <Outlet />;
};

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
