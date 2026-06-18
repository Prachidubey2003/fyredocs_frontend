import {
  LayoutDashboard,
  Files,
  ListChecks,
  Download,
  Star,
  Share2,
  Trash2,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface AppNavItem {
  title: string;
  /** Route to navigate to (omitted for not-yet-built items). */
  path?: string;
  icon: LucideIcon;
  /** Renders as a disabled "Soon" item. */
  soon?: boolean;
}

export interface AppNavGroup {
  label: string;
  items: AppNavItem[];
}

export const APP_NAV: AppNavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { title: 'Dashboard', path: '/app', icon: LayoutDashboard },
      { title: 'Documents', path: '/app/documents', icon: Files },
      { title: 'Processing Jobs', path: '/app/documents?status=active', icon: ListChecks },
      { title: 'Exports', path: '/app/exports', icon: Download },
    ],
  },
  {
    label: 'Library',
    items: [
      { title: 'Members', path: '/app/members', icon: Users },
      { title: 'Favorites', icon: Star, soon: true },
      { title: 'Shared', icon: Share2, soon: true },
      { title: 'Trash', path: '/app/trash', icon: Trash2 },
      { title: 'Settings', icon: Settings, soon: true },
    ],
  },
];
