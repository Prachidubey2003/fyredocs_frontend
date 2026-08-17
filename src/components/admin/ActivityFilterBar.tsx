import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

export type ActivityFilters = {
  eventType: string;
  status: string;
  platform: string;
  userId: string;
  from: string;
  to: string;
};

export const EMPTY_ACTIVITY_FILTERS: ActivityFilters = {
  eventType: '',
  status: '',
  platform: '',
  userId: '',
  from: '',
  to: '',
};

// Sentinel for "no filter": Radix Select rejects an empty-string item value,
// so the unfiltered choice needs a real one that we translate back to ''.
const ALL = 'all';

const EVENT_TYPES = [
  'job.started',
  'job.completed',
  'job.failed',
  'job.cancelled',
  'auth.login',
  'auth.logout',
  'auth.signup',
  'auth.password_reset',
  'auth.refresh_reuse',
  'auth.proxy_login',
  'plan.changed',
  'plan.limit_hit',
  'share.link_created',
  'settings.changed',
];

type Props = {
  filters: ActivityFilters;
  onChange: (next: ActivityFilters) => void;
};

export const ActivityFilterBar = ({ filters, onChange }: Props) => {
  const set = (key: keyof ActivityFilters, value: string) =>
    onChange({ ...filters, [key]: value === ALL ? '' : value });

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-48">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Event type</label>
        <Select value={filters.eventType || ALL} onValueChange={(v) => set('eventType', v)}>
          <SelectTrigger>
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All events</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
        <Select value={filters.status || ALL} onValueChange={(v) => set('status', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Platform</label>
        <Select value={filters.platform || ALL} onValueChange={(v) => set('platform', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Any platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any platform</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="ios">iOS</SelectItem>
            <SelectItem value="android">Android</SelectItem>
            <SelectItem value="server">Server</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-72">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">User ID</label>
        <Input
          value={filters.userId}
          onChange={(e) => set('userId', e.target.value)}
          placeholder="Exact user UUID"
          className="font-mono text-xs"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => set('from', e.target.value)}
          className="w-40"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => set('to', e.target.value)}
          className="w-40"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_ACTIVITY_FILTERS)}>
          <X className="mr-1 h-4 w-4" aria-hidden />
          Clear
        </Button>
      )}
    </div>
  );
};
