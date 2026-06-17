import type { ReactNode } from 'react';
import { Heading, Text } from '@/components/ui/typography';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  /** Right-aligned controls — export-all, last-updated timestamp, etc. */
  actions?: ReactNode;
}

/**
 * Page title for admin pages. Navigation, refresh, and time range live in the
 * AdminLayout shell; an optional `actions` slot holds page-level controls.
 */
export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <Heading level="h2" as="h1">
          {title}
        </Heading>
        <Text variant="body-sm" tone="muted" className="mt-1">
          {description}
        </Text>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
