import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  LogIn,
  Settings2,
  Share2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyActivity } from '@/hooks/useMyActivity';
import type { ActivityItem } from '@/lib/activityApi';
import { TOOLS } from '@/config/tools';
import type { ToolId } from '@/types';

const PAGE_SIZE = 50;

type Category = 'all' | 'tools' | 'account' | 'sharing';

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All',
  tools: 'Tools & conversions',
  account: 'Account & security',
  sharing: 'Sharing',
};

const categoryOf = (eventType: string): Exclude<Category, 'all'> => {
  if (eventType.startsWith('job.') || eventType.startsWith('upload.')) return 'tools';
  if (eventType.startsWith('share.')) return 'sharing';
  return 'account';
};

const describeEvent = (item: ActivityItem): string => {
  const toolName =
    item.toolId && item.toolId in TOOLS ? TOOLS[item.toolId as ToolId].name : item.toolId;

  switch (item.eventType) {
    case 'job.started':
      return toolName ? `Started ${toolName}` : 'Started a tool job';
    case 'job.completed':
      return toolName ? `${toolName} finished` : 'Job finished';
    case 'job.failed':
      return toolName ? `${toolName} failed` : 'Job failed';
    case 'job.cancelled':
      return toolName ? `${toolName} cancelled` : 'Job cancelled';
    case 'auth.login':
      return item.status === 'failed' ? 'Failed sign-in attempt' : 'Signed in';
    case 'auth.logout':
      return 'Signed out';
    case 'auth.signup':
      return 'Account created';
    case 'auth.password_reset':
      return 'Password reset';
    case 'auth.refresh_reuse':
      return 'Suspicious session activity detected';
    case 'auth.proxy_login':
      return 'Support accessed your account';
    case 'plan.changed':
      return 'Plan changed';
    case 'plan.limit_hit':
      return 'Plan limit reached';
    case 'share.link_created':
      return 'Share link created';
    case 'share.link_revoked':
      return 'Share link revoked';
    case 'settings.changed':
      return 'Settings updated';
    default:
      return item.eventType;
  }
};

const eventIcon = (item: ActivityItem) => {
  if (item.eventType.startsWith('auth.')) return LogIn;
  if (item.eventType.startsWith('share.')) return Share2;
  if (item.eventType.startsWith('settings.')) return Settings2;
  if (item.eventType.startsWith('job.') || item.eventType.startsWith('upload.')) return FileText;
  return Activity;
};

const StatusBadge = ({ status }: { status: ActivityItem['status'] }) => {
  switch (status) {
    case 'success':
      return (
        <Badge variant="secondary" className="gap-1 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Done
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="secondary" className="gap-1 text-destructive">
          <AlertCircle className="h-3 w-3" aria-hidden />
          Failed
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="secondary" className="gap-1 text-muted-foreground">
          <XCircle className="h-3 w-3" aria-hidden />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden />
          In progress
        </Badge>
      );
  }
};

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const dayKey = (iso: string): string => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
};

const ActivityPage = () => {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<Category>('all');
  const { data, isLoading, isError } = useMyActivity({ page, limit: PAGE_SIZE });

  const groups = useMemo(() => {
    const items = (data?.items ?? []).filter(
      (item) => category === 'all' || categoryOf(item.eventType) === category
    );
    const byDay = new Map<string, ActivityItem[]>();
    for (const item of items) {
      const key = dayKey(item.occurredAt);
      const bucket = byDay.get(key);
      if (bucket) bucket.push(item);
      else byDay.set(key, [item]);
    }
    return Array.from(byDay.entries());
  }, [data?.items, category]);

  const total = data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Helmet>
        <title>My Activity — FyreDocs</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Activity</h1>
        <p className="text-muted-foreground mt-1">
          Your recent tool runs, sign-ins, and account changes.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={category === key ? 'default' : 'outline'}
            onClick={() => setCategory(key)}
          >
            {CATEGORY_LABELS[key]}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
            <p className="font-medium">Couldn't load your activity</p>
            <p className="text-sm text-muted-foreground">Please try again in a moment.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && groups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">No activity yet</p>
            <p className="text-sm text-muted-foreground">
              Run a tool or update your account and it will show up here.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        !isError &&
        groups.map(([day, items]) => (
          <section key={day} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {day}
            </h2>
            <Card>
              <CardContent className="divide-y p-0">
                {items.map((item) => {
                  const Icon = eventIcon(item);
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{describeEvent(item)}</p>
                        {item.failureReason && (
                          <p className="truncate text-xs text-muted-foreground">
                            {item.failureReason}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <StatusBadge status={item.status} />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {timeLabel(item.occurredAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        ))}

      {!isLoading && !isError && pageCount > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Newer
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Older
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
