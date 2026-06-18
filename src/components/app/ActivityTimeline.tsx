import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { getToolById } from '@/config/tools';
import { toolNavName } from '@/config/navigation';
import { cn } from '@/lib/utils';
import type { ActivityItem } from '@/lib/userMetrics';

const VERB_META = {
  processed: { icon: CheckCircle2, tone: 'text-success', label: 'Processed' },
  failed: { icon: XCircle, tone: 'text-destructive', label: 'Failed' },
  started: { icon: Loader2, tone: 'text-info', label: 'Started' },
} as const;

/** Chronological activity feed derived from recent jobs. */
export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-caption text-muted-foreground">No recent activity yet.</p>;
  }

  return (
    <ol className="relative space-y-4 pl-5">
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-border" aria-hidden />
      {items.map((item) => {
        const tool = getToolById(item.job.toolId);
        const meta = VERB_META[item.verb];
        const Icon = meta.icon;
        const name = item.job.result?.fileName ?? (tool ? toolNavName(tool) : 'Document');
        return (
          <li key={item.id} className="relative">
            <span className="absolute -left-5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background">
              <Icon className={cn('h-3.5 w-3.5', meta.tone)} aria-hidden />
            </span>
            <p className="text-sm leading-tight">
              <span className="font-medium">{meta.label}</span>{' '}
              <span className="text-muted-foreground">{name}</span>
              {tool && <span className="text-muted-foreground"> · {toolNavName(tool)}</span>}
            </p>
            <p className="text-caption text-muted-foreground">
              {formatDistanceToNow(item.at, { addSuffix: true })}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
