import { AlertTriangle, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** When provided, renders a Retry button. */
  onRetry?: () => void;
  retryLabel?: string;
  size?: 'sm' | 'default';
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this content. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  size = 'default',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'default' ? 'py-16 px-6' : 'py-8 px-4',
        className,
      )}
    >
      <div
        className={cn(
          'mb-4 rounded-full bg-destructive-subtle text-destructive-subtle-foreground',
          size === 'default' ? 'p-4' : 'p-3',
        )}
      >
        <AlertTriangle className={size === 'default' ? 'h-7 w-7' : 'h-5 w-5'} aria-hidden />
      </div>
      <Heading level="h4" as={size === 'default' ? 'h3' : 'h4'}>
        {title}
      </Heading>
      {description && (
        <Text variant="body-sm" tone="muted" className="mt-1.5 max-w-sm">
          {description}
        </Text>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-5">
          <RefreshCw aria-hidden />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
