import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useNotificationStream,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import type { ApiNotification } from '@/lib/notificationsApi';

function icon(type: string) {
  if (type === 'job.failed') return <XCircle className="h-4 w-4 text-destructive" aria-hidden />;
  return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />;
}

/** Topbar notifications bell: unread badge, recent feed, mark-read. */
export function NotificationBell() {
  const navigate = useNavigate();
  const { data } = useNotifications();
  useNotificationStream();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  const onClick = (n: ApiNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell className="h-4 w-4" aria-hidden />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-caption" onClick={() => markAll.mutate()}>
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all read
            </Button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-caption text-muted-foreground">
            You’re all caught up. Processing and export updates show up here.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onClick(n)}
                  className={cn(
                    'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50',
                    !n.readAt && 'bg-primary/5',
                  )}
                >
                  <span className="mt-0.5 shrink-0">{icon(n.type)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />}
                    </span>
                    {n.body && <span className="block truncate text-caption text-muted-foreground">{n.body}</span>}
                    <span className="block text-caption text-muted-foreground/70">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
