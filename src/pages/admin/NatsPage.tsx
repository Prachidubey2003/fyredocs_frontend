import { useEffect, useMemo, useState } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { KpiCard } from '@/components/admin/KpiCard';
import { HealthStatusStrip, type HealthSegment } from '@/components/admin/HealthStatusStrip';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { useNats } from '@/hooks/useAdminMetrics';
import type { NatsStreamRow, NatsConsumerRow } from '@/lib/adminApi';
import { formatNumber } from '@/components/admin/chartTheme';

/** ~5 min of history at the 5s NATS poll. */
const MAX_POINTS = 60;

interface NatsPoint {
  time: string;
  messages: number;
  streams: number;
  backlog: number;
  dlq: number;
}

/**
 * Module-level rolling buffer. NATS has no server-side history (it's a live
 * snapshot), so we accumulate one point per 5s poll. Keeping it at module scope
 * means the sparklines survive navigating away from and back to the tab within
 * the session (a full page reload clears it — acceptable).
 */
const natsHistory: NatsPoint[] = [];

function pushNatsPoint(p: NatsPoint) {
  const last = natsHistory[natsHistory.length - 1];
  if (!last || last.time !== p.time) {
    natsHistory.push(p);
    if (natsHistory.length > MAX_POINTS) natsHistory.shift();
  }
}

/**
 * Series for a metric. A single point is duplicated so the Sparkline (which
 * needs ≥2 points) draws a line on the very first poll instead of staying blank.
 */
function seriesOf(sel: (p: NatsPoint) => number): number[] {
  const s = natsHistory.map(sel);
  return s.length === 1 ? [s[0], s[0]] : s;
}

/** Human-readable bytes (KiB/MiB/GiB). */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

const streamColumns: Column<NatsStreamRow>[] = [
  { key: 'name', label: 'Stream', sortable: true, className: 'font-medium' },
  { key: 'messages', label: 'Messages', sortable: true, align: 'right', render: (v) => formatNumber(v as number) },
  { key: 'bytes', label: 'Size', sortable: true, align: 'right', render: (v) => formatBytes(v as number) },
  { key: 'consumerCount', label: 'Consumers', sortable: true, align: 'right', render: (v) => (v as number).toLocaleString() },
  { key: 'lastSeq', label: 'Last Seq', sortable: true, align: 'right', render: (v) => (v as number).toLocaleString() },
];

const consumerColumns: Column<NatsConsumerRow>[] = [
  { key: 'stream', label: 'Stream', sortable: true, className: 'text-xs text-muted-foreground' },
  { key: 'name', label: 'Consumer', sortable: true, className: 'font-medium' },
  { key: 'numPending', label: 'Pending', sortable: true, align: 'right', render: (v) => formatNumber(v as number) },
  { key: 'numAckPending', label: 'Ack Pending', sortable: true, align: 'right', render: (v) => (v as number).toLocaleString() },
  { key: 'numRedelivered', label: 'Redelivered', sortable: true, align: 'right', render: (v) => (v as number).toLocaleString() },
];

const NatsPage = () => {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useNats();
  const server = data?.server;
  const summary = data?.summary;
  const streams = data?.streams ?? [];
  // Memoized so the identity is stable for the backlog useMemo below.
  const consumers = useMemo(() => data?.consumers ?? [], [data?.consumers]);

  const unreachable = server?.status === 'unreachable' || summary?.status === 'unreachable';
  const dlqDepth = summary?.dlqDepth ?? 0;
  const streamCount = summary?.totalStreams ?? streams.length;
  const messageCount = summary?.totalMessages ?? 0;
  const backlog = useMemo(
    () => consumers.reduce((sum, c) => sum + c.numPending + c.numAckPending, 0),
    [consumers],
  );

  // Append one history point per poll (module-level buffer, see pushNatsPoint).
  const [, bump] = useState(0);
  useEffect(() => {
    if (!data || !dataUpdatedAt || unreachable) return;
    pushNatsPoint({
      time: new Date(dataUpdatedAt).toISOString(),
      messages: messageCount,
      streams: streamCount,
      backlog,
      dlq: dlqDepth,
    });
    bump((n) => n + 1);
  }, [data, dataUpdatedAt, unreachable, messageCount, streamCount, backlog, dlqDepth]);

  const spark = useMemo(
    () => ({
      messages: seriesOf((p) => p.messages),
      streams: seriesOf((p) => p.streams),
      backlog: seriesOf((p) => p.backlog),
      dlq: seriesOf((p) => p.dlq),
    }),
    // Keyed on dataUpdatedAt so this re-derives only when react-query reports
    // the payload actually changed. Depending on the data object instead would
    // re-run on every refetch, including ones returning identical rows.
    [dataUpdatedAt], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const healthSegments: HealthSegment[] = useMemo(() => {
    const segs: HealthSegment[] = [];
    segs.push({
      label: 'NATS server',
      status: unreachable ? 'critical' : 'healthy',
      detail: unreachable ? (server?.error ?? 'unreachable') : `${server?.connections ?? 0} connections`,
    });
    segs.push({
      label: 'Dead-letter queue',
      status: dlqDepth > 0 ? 'warning' : 'healthy',
      detail: `${dlqDepth} dead-lettered`,
    });
    segs.push({
      label: 'Consumer backlog',
      status: backlog > 1000 ? 'warning' : 'healthy',
      detail: `${formatNumber(backlog)} pending`,
    });
    return segs;
  }, [server, backlog, unreachable, dlqDepth]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <AdminPageHeader title="NATS / JetStream" description="Message queue streams, consumers, and server health" />

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {unreachable && !isLoading && (
            <Card>
              <CardContent className="p-4">
                <p className="text-caption text-warning">
                  NATS monitoring endpoint unreachable{server?.error ? `: ${server.error}` : '.'} Showing last-known
                  state where available.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard
              label="Total Messages"
              value={summary?.totalMessages != null ? formatNumber(messageCount) : '—'}
              sparkline={spark.messages}
              status="healthy"
              isLoading={isLoading && natsHistory.length === 0}
            />
            <KpiCard
              label="Streams"
              value={formatNumber(streamCount)}
              sparkline={spark.streams}
              status="healthy"
              isLoading={isLoading && natsHistory.length === 0}
            />
            <KpiCard
              label="Consumer backlog"
              value={formatNumber(backlog)}
              sparkline={spark.backlog}
              status={backlog > 1000 ? 'warning' : 'healthy'}
              insight={backlog > 0 ? `${formatNumber(backlog)} pending` : undefined}
              isLoading={isLoading && natsHistory.length === 0}
            />
            <KpiCard
              label="DLQ Depth"
              value={formatNumber(dlqDepth)}
              sparkline={spark.dlq}
              status={dlqDepth > 0 ? 'critical' : 'healthy'}
              insight={dlqDepth > 0 ? `${formatNumber(dlqDepth)} dead-lettered` : undefined}
              isLoading={isLoading && natsHistory.length === 0}
            />
          </div>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Server health</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <HealthStatusStrip segments={healthSegments} />
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-caption sm:grid-cols-4">
                <div><span className="text-muted-foreground">Version</span><div className="font-medium">{server?.version ?? '—'}</div></div>
                <div><span className="text-muted-foreground">Uptime</span><div className="font-medium">{server?.uptime ?? '—'}</div></div>
                <div><span className="text-muted-foreground">Connections</span><div className="font-medium">{server?.connections ?? '—'}</div></div>
                <div><span className="text-muted-foreground">Memory</span><div className="font-medium">{server?.memoryMB != null ? `${server.memoryMB.toFixed(1)} MB` : '—'}</div></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Streams</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <DataTable<NatsStreamRow>
                data={streams}
                columns={streamColumns}
                isLoading={isLoading}
                searchableFields={['name']}
                defaultSort={{ key: 'name', desc: false }}
                emptyMessage="No JetStream streams found"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Consumers</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <DataTable<NatsConsumerRow>
                data={consumers}
                columns={consumerColumns}
                isLoading={isLoading}
                searchableFields={['name', 'stream']}
                defaultSort={{ key: 'stream', desc: false }}
                emptyMessage="No consumers found"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default NatsPage;
