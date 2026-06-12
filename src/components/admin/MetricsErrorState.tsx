import { ErrorState } from '@/components/common/ErrorState';

interface MetricsErrorStateProps {
  onRetry?: () => void;
  title?: string;
  /** Smaller paddings for card-level placement. */
  compact?: boolean;
  className?: string;
}

/** Standard error fallback for admin metric pages and cards. */
export function MetricsErrorState({
  onRetry,
  title = 'Failed to load metrics',
  compact = false,
  className,
}: MetricsErrorStateProps) {
  return (
    <ErrorState
      title={title}
      description="The metrics service did not respond. Check your connection and try again."
      onRetry={onRetry}
      size={compact ? 'sm' : 'default'}
      className={className}
    />
  );
}
