import { cn } from '@/lib/utils';
import { Heading, Text } from '@/components/ui/typography';

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned action slot (buttons, selects). */
  actions?: React.ReactNode;
  /** Rendered above the title (e.g. a <Breadcrumb> or icon row). */
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-8 border-b pb-6', className)}>
      {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Heading level="h1" responsive>
            {title}
          </Heading>
          {description && (
            <Text tone="muted" className="mt-2 max-w-2xl">
              {description}
            </Text>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
