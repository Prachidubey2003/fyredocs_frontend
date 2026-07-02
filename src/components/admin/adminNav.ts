import {
  Activity,
  DollarSign,
  Gauge,
  LayoutDashboard,
  MousePointerClick,
  Server,
  ShieldCheck,
  TrendingUp,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavGroup = 'product' | 'infrastructure';

export interface AdminSection {
  title: string;
  path: string;
  icon: LucideIcon;
  /** Sidebar grouping: product analytics vs infrastructure/operations. */
  group: AdminNavGroup;
  /**
   * Whether the page's data hooks accept a `?days=` range. Realtime pages
   * (System / Server / API) ignore it, so the shell disables the selector there.
   */
  supportsTimeRange: boolean;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { title: 'Overview', path: '/dashboard', icon: LayoutDashboard, group: 'product', supportsTimeRange: true },
  { title: 'Business', path: '/admin/business', icon: DollarSign, group: 'product', supportsTimeRange: true },
  { title: 'Growth', path: '/admin/growth', icon: TrendingUp, group: 'product', supportsTimeRange: true },
  { title: 'Engagement', path: '/admin/engagement', icon: MousePointerClick, group: 'product', supportsTimeRange: true },
  { title: 'Reliability', path: '/admin/reliability', icon: ShieldCheck, group: 'infrastructure', supportsTimeRange: true },
  { title: 'System', path: '/admin/system', icon: Activity, group: 'infrastructure', supportsTimeRange: false },
  { title: 'NATS', path: '/admin/nats', icon: Waypoints, group: 'infrastructure', supportsTimeRange: false },
  { title: 'Server', path: '/admin/server-performance', icon: Server, group: 'infrastructure', supportsTimeRange: false },
  { title: 'API', path: '/admin/api-performance', icon: Gauge, group: 'infrastructure', supportsTimeRange: false },
];

export const ADMIN_NAV_GROUPS: { id: AdminNavGroup; label: string }[] = [
  { id: 'product', label: 'Product' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

export function findAdminSection(pathname: string): AdminSection {
  return ADMIN_SECTIONS.find((section) => section.path === pathname) ?? ADMIN_SECTIONS[0];
}
