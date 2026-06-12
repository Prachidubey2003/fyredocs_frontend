import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-semibold',
  {
    variants: {
      status: {
        idle: 'bg-muted text-muted-foreground',
        pending: 'bg-muted text-muted-foreground',
        queued: 'bg-warning-subtle text-warning-subtle-foreground',
        processing: 'bg-accent text-accent-foreground',
        completed: 'bg-success-subtle text-success-subtle-foreground',
        failed: 'bg-destructive-subtle text-destructive-subtle-foreground',
        expired: 'bg-muted text-muted-foreground line-through',
      },
    },
    defaultVariants: {
      status: 'idle',
    },
  },
);

const STATUS_LABELS: Record<NonNullable<VariantProps<typeof statusBadgeVariants>['status']>, string> = {
  idle: 'Idle',
  pending: 'Pending',
  queued: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  expired: 'Expired',
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Override the default label for the status. */
  label?: string;
  /** Show a pulsing dot (e.g. live/queued states). */
  pulse?: boolean;
}

export function StatusBadge({ status = 'idle', label, pulse, className, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {status === 'processing' ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : pulse ? (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      ) : null}
      {label ?? STATUS_LABELS[status ?? 'idle']}
    </span>
  );
}
