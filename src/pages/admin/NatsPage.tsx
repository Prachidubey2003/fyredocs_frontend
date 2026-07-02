import { useMemo } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { HealthStatusStrip, type HealthSegment } from '@/components/admin/HealthStatusStrip';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/admin/DataTable';
import { Database, Layers, Users, AlertTriangle } from 'lucide-react';
import { useNats } from '@/hooks/useAdminMetrics';
import type { NatsStreamRow, NatsConsumerRow } from '@/lib/adminApi';
import { formatNumber } from '@/components/admin/chartTheme';

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
  const { data, isLoading, isError, refetch } = useNats();
  const server = data?.server;
  const summary = data?.summary;
  const streams = data?.streams ?? [];
  const consumers = data?.consumers ?? [];

  const unreachable = server?.status === 'unreachable' || summary?.status === 'unreachable';
  const dlqDepth = summary?.dlqDepth ?? 0;

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
    const backlog = consumers.reduce((sum, c) => sum + c.numPending + c.numAckPending, 0);
    segs.push({
      label: 'Consumer backlog',
      status: backlog > 1000 ? 'warning' : 'healthy',
      detail: `${formatNumber(backlog)} pending`,
    });
    return segs;
  }, [server, consumers, unreachable, dlqDepth]);

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
            <StatCard label="Streams" value={summary?.totalStreams ?? streams.length} icon={Layers} tone="info" isLoading={isLoading} />
            <StatCard label="Consumers" value={summary?.totalConsumers ?? consumers.length} icon={Users} tone="info" isLoading={isLoading} />
            <StatCard label="Total Messages" value={summary?.totalMessages != null ? formatNumber(summary.totalMessages) : '—'} icon={Database} tone="default" isLoading={isLoading} />
            <StatCard
              label="DLQ Depth"
              value={dlqDepth}
              icon={AlertTriangle}
              tone={dlqDepth > 0 ? 'warning' : 'success'}
              color={dlqDepth > 0 ? 'text-warning' : 'text-success'}
              isLoading={isLoading}
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
