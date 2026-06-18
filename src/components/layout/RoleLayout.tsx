import { useAuth } from '@/auth/useAuth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { UserLayout } from '@/components/layout/UserLayout';

const ADMIN_ROLES = ['admin', 'super-admin'];

/**
 * Picks the shell for the unified /dashboard route based on the caller's role:
 * admins get the AdminLayout (admin sidebar/nav), everyone else the UserLayout.
 * Both layouts render an <Outlet/>, so the nested dashboard route renders inside
 * the chosen shell.
 */
export function RoleLayout() {
  const { role } = useAuth();
  if (role && ADMIN_ROLES.includes(role)) {
    return <AdminLayout />;
  }
  return <UserLayout />;
}

export default RoleLayout;
