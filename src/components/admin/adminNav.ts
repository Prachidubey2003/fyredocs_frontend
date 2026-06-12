import {
  Activity,
  DollarSign,
  Gauge,
  LayoutDashboard,
  MousePointerClick,
  Server,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export interface AdminSection {
  title: string;
  path: string;
  icon: LucideIcon;
  /**
   * Whether the page's data hooks accept a `?days=` range. Realtime pages
   * (System / Server / API) ignore it, so the shell hides the selector there.
   */
  supportsTimeRange: boolean;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { title: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard, supportsTimeRange: true },
  { title: 'Business', path: '/admin/business', icon: DollarSign, supportsTimeRange: true },
  { title: 'Growth', path: '/admin/growth', icon: TrendingUp, supportsTimeRange: true },
  { title: 'Engagement', path: '/admin/engagement', icon: MousePointerClick, supportsTimeRange: true },
  { title: 'Reliability', path: '/admin/reliability', icon: ShieldCheck, supportsTimeRange: true },
  { title: 'System', path: '/admin/system', icon: Activity, supportsTimeRange: false },
  { title: 'Server', path: '/admin/server-performance', icon: Server, supportsTimeRange: false },
  { title: 'API', path: '/admin/api-performance', icon: Gauge, supportsTimeRange: false },
];

export function findAdminSection(pathname: string): AdminSection {
  return ADMIN_SECTIONS.find((section) => section.path === pathname) ?? ADMIN_SECTIONS[0];
}
