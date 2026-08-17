import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildApiUrl } from '@/lib/apiClient';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { useServerDataTable } from '@/hooks/useDataTable';
import { useAdminActivity } from '@/hooks/useAdminMetrics';
import type { AdminActivityItem } from '@/lib/adminApi';
import {
  ActivityFilterBar,
  EMPTY_ACTIVITY_FILTERS,
  type ActivityFilters,
} from '@/components/admin/ActivityFilterBar';

const PAGE_SIZE = 25;

const statusColor: Record<AdminActivityItem['status'], string> = {
  success: 'text-green-600',
  failed: 'text-red-600',
  cancelled: 'text-muted-foreground',
  started: 'text-yellow-600',
};

const activityColumns: Column<AdminActivityItem>[] = [
  {
    key: 'occurredAt',
    label: 'When',
    sortable: true,
    className: 'whitespace-nowrap text-xs',
    render: (v) => new Date(v as string).toLocaleString(),
  },
  { key: 'eventType', label: 'Event', sortable: true, className: 'font-mono text-xs' },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (_v, row) => <span className={statusColor[row.status]}>{row.status}</span>,
  },
  {
    key: 'userId',
    label: 'User',
    truncate: 12,
    className: 'font-mono text-xs',
    render: (_v, row) => (row.isGuest ? <Badge variant="secondary">guest</Badge> : row.userId ?? '—'),
  },
  { key: 'toolId', label: 'Tool', render: (v) => (v as string) || '—' },
  { key: 'platform', label: 'Platform', sortable: true, render: (v) => (v as string) || '—' },
  { key: 'correlationId', label: 'Correlation', truncate: 14, className: 'font-mono text-xs' },
  { key: 'failureReason', label: 'Failure reason', truncate: 30, className: 'text-xs' },
];

const ActivityAuditPage = () => {
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(
    () => queryClient.resetQueries({ queryKey: ['admin', 'activity'] }),
    [queryClient]
  );
  const [filters, setFilters] = useState<ActivityFilters>(EMPTY_ACTIVITY_FILTERS);
  const table = useServerDataTable<AdminActivityItem>({
    pageSize: PAGE_SIZE,
    defaultSort: { key: 'occurredAt', desc: true },
  });

  // Changing a filter must snap back to page 1 — staying on page 7 of a
  // now-3-page result set renders an empty table with live pagination.
  const applyFilters = useCallback(
    (next: ActivityFilters) => {
      setFilters(next);
      table.setPage(1);
    },
    [table]
  );

  const queryParams = useMemo(
    () => ({
      page: table.page,
      limit: PAGE_SIZE,
      search: table.search || undefined,
      sort: table.sortKey ? String(table.sortKey) : undefined,
      order: (table.sortKey ? (table.sortDesc ? 'desc' : 'asc') : undefined) as
        | 'asc'
        | 'desc'
        | undefined,
      eventType: filters.eventType || undefined,
      status: filters.status || undefined,
      platform: filters.platform || undefined,
      userId: filters.userId || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    }),
    [table.page, table.search, table.sortKey, table.sortDesc, filters]
  );

  const { data: resp, isLoading } = useAdminActivity(queryParams);
  const totalRows = Number(resp?.meta?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const [exporting, setExporting] = useState(false);

  // Raw fetch, not apiRequest: the response is a file attachment, and the
  // export must carry the CURRENT filters so what the admin sees is what
  // gets exported (the server audits both the filters and the row count).
  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      setExporting(true);
      try {
        const q = new URLSearchParams({ format });
        for (const [key, value] of Object.entries(queryParams)) {
          if (value !== undefined && key !== 'page' && key !== 'limit') q.set(key, String(value));
        }
        const res = await fetch(buildApiUrl(`/admin/activity/export?${q}`), {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Export failed (${res.status})`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-${new Date().toISOString().slice(0, 10)}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast.error("Couldn't export the audit trail.");
      } finally {
        setExporting(false);
      }
    },
    [queryParams]
  );

  return (
    <div className="space-y-6 px-4 py-8">
      <AdminPageHeader
        title="Activity Audit"
        description="Every recorded user action across web, mobile, and server"
        onRefresh={handleRefresh}
      />

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            {totalRows.toLocaleString()} events. Search covers event type, failure reason, and
            correlation id.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <ActivityFilterBar filters={filters} onChange={applyFilters} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={exporting} onClick={() => void handleExport('csv')}>
                <Download className="mr-1 h-4 w-4" aria-hidden />
                CSV
              </Button>
              <Button variant="outline" size="sm" disabled={exporting} onClick={() => void handleExport('json')}>
                <Download className="mr-1 h-4 w-4" aria-hidden />
                JSON
              </Button>
            </div>
          </div>
          <DataTable<AdminActivityItem>
            serverSide
            data={resp?.data ?? []}
            columns={activityColumns}
            isLoading={isLoading}
            emptyMessage="No activity matches the current filters"
            search={table.search}
            onSearchChange={table.setSearch}
            sortKey={table.sortKey}
            sortDesc={table.sortDesc}
            onSortChange={table.toggleSort}
            page={table.page}
            onPageChange={table.setPage}
            pageCount={pageCount}
            totalRows={totalRows}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityAuditPage;
