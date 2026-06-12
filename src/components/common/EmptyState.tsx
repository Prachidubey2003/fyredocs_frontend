import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Heading, Text } from '@/components/ui/typography';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional action (typically a <Button>). */
  action?: React.ReactNode;
  /** sm fits inside tables/cards; default fills a page section. */
  size?: 'sm' | 'default';
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, size = 'default', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'default' ? 'py-16 px-6' : 'py-8 px-4',
        className,
      )}
    >
      {Icon && (
        <div className={cn('mb-4 rounded-full bg-muted text-muted-foreground', size === 'default' ? 'p-4' : 'p-3')}>
          <Icon className={size === 'default' ? 'h-7 w-7' : 'h-5 w-5'} aria-hidden />
        </div>
      )}
      <Heading level="h4" as={size === 'default' ? 'h3' : 'h4'}>
        {title}
      </Heading>
      {description && (
        <Text variant="body-sm" tone="muted" className="mt-1.5 max-w-sm">
          {description}
        </Text>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
