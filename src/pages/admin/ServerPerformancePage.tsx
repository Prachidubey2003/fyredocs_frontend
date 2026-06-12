import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ProgressRing } from '@/components/admin/ProgressRing';
import { AnimatedNumber } from '@/components/admin/AnimatedNumber';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Server, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { useServerPerformance } from '@/hooks/useAdminMetrics';
import { usageToneClass, usageToneColor } from '@/components/admin/chartTheme';

/** Bar fill class for a utilization percentage (lower is better). */
function usageBarClass(pct: number): string {
  if (pct > 80) return 'bg-destructive';
  if (pct > 50) return 'bg-warning';
  return 'bg-success';
}

const ServerPerformancePage = () => {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useServerPerformance();
  const d = data;
  const sys = d?.system;
  const avail = d?.availability;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <AdminPageHeader
          title="Server Performance"
          description="CPU, memory, storage, and service availability"
        />
        <div className="mt-2 flex shrink-0 items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <span className="text-xs text-muted-foreground">
            Live{lastUpdated ? ` · ${lastUpdated}` : ''}
          </span>
        </div>
      </div>

      {isError ? (
        <MetricsErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {/* System overview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="System Uptime"
              value={sys?.uptime ?? 'N/A'}
              icon={Server}
              tone="success"
              isLoading={isLoading}
            />
            <StatCard
              label="CPU"
              value={sys?.cpu?.usagePercent != null ? `${sys.cpu.usagePercent.toFixed(0)}%` : 'N/A'}
              icon={Cpu}
              tone="info"
              color={(sys?.cpu?.usagePercent ?? 0) > 80 ? 'text-destructive' : 'text-foreground'}
              subtitle={sys?.cpu?.count != null ? `${sys.cpu.count} cores` : undefined}
              isLoading={isLoading}
            />
            <StatCard
              label="Memory"
              value={sys?.memory?.usagePercent != null ? `${sys.memory.usagePercent.toFixed(0)}%` : 'N/A'}
              icon={MemoryStick}
              tone="success"
              color={(sys?.memory?.usagePercent ?? 0) > 80 ? 'text-destructive' : 'text-foreground'}
              subtitle={sys?.memory ? `${((sys.memory.usedMB ?? 0) / 1024).toFixed(1)} / ${((sys.memory.totalMB ?? 0) / 1024).toFixed(1)} GB` : undefined}
              isLoading={isLoading}
            />
            <StatCard
              label="Storage"
              value={sys?.storage?.usagePercent != null ? `${sys.storage.usagePercent.toFixed(0)}%` : 'N/A'}
              icon={HardDrive}
              tone="brand"
              color={(sys?.storage?.usagePercent ?? 0) > 80 ? 'text-destructive' : 'text-foreground'}
              subtitle={sys?.storage ? `${(sys.storage.usedGB ?? 0).toFixed(1)} / ${(sys.storage.totalGB ?? 0).toFixed(1)} GB` : undefined}
              isLoading={isLoading}
            />
          </div>

          {isLoading ? null : (
            <>
              {/* Load averages */}
              <Card>
                <CardHeader>
                  <CardTitle>Load Averages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-around gap-4">
                    {[
                      { label: '1 min', value: sys?.cpu?.loadAvg1m ?? 0 },
                      { label: '5 min', value: sys?.cpu?.loadAvg5m ?? 0 },
                      { label: '15 min', value: sys?.cpu?.loadAvg15m ?? 0 },
                    ].map((item) => {
                      const cores = sys?.cpu?.count ?? 1;
                      const pct = Math.min((item.value / cores) * 100, 100);
                      return (
                        <div key={item.label} className="flex flex-col items-center gap-2">
                          <ProgressRing value={pct} size={72} strokeWidth={7} color={usageToneColor(pct)}
                            label={item.value.toFixed(2)} />
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Memory details */}
              <Card>
                <CardHeader>
                  <CardTitle>Memory Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Used</span>
                    <span className="font-medium"><AnimatedNumber value={(sys?.memory?.usedMB ?? 0) / 1024} decimals={2} suffix=" GB" /></span>
                  </div>
                  <Progress value={sys?.memory?.usagePercent ?? 0} className="transition-all duration-700" />
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium"><AnimatedNumber value={(sys?.memory?.totalMB ?? 0) / 1024} decimals={2} suffix=" GB" /></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Free</p>
                      <p className="font-medium"><AnimatedNumber value={(sys?.memory?.freeMB ?? 0) / 1024} decimals={2} suffix=" GB" /></p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p className="font-medium"><AnimatedNumber value={(sys?.memory?.availableMB ?? 0) / 1024} decimals={2} suffix=" GB" /></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Health Grid */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Health</CardTitle>
                  <CardDescription>
                    {avail?.healthyServices}/{avail?.totalServices} services healthy — {(avail?.uptimePercent ?? 0).toFixed(0)}% availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {d?.services && Object.entries(d.services).map(([name, svc]) => {
                      const healthy = svc.status === 'healthy';
                      const heapMB = svc.memory?.heapAllocMB ?? 0;
                      const heapPct = Math.min((heapMB / 20) * 100, 100);
                      return (
                        <Card key={name} className={`border-l-4 p-4 ${healthy ? 'border-l-success' : 'border-l-destructive'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${healthy ? 'bg-success' : 'bg-destructive'}`} />
                              <span className="text-sm font-medium">{name}</span>
                            </div>
                            <Badge variant={healthy ? 'default' : 'destructive'} className="px-1.5 py-0 text-[10px]">
                              {svc.status}
                            </Badge>
                          </div>
                          {healthy ? (
                            <div className="mt-3 space-y-2.5">
                              {svc.goroutines != null && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Goroutines</span>
                                  <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px]">
                                    <AnimatedNumber value={svc.goroutines} />
                                  </Badge>
                                </div>
                              )}
                              {svc.memory && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Heap</span>
                                    <span className={`text-xs font-medium ${usageToneClass(heapPct, 50, 80)}`}>
                                      <AnimatedNumber value={heapMB} decimals={1} suffix=" MB" />
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${usageBarClass(heapPct)}`}
                                      style={{ width: `${heapPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {(svc.uptime || svc.goVersion) && (
                                <div className="flex items-center gap-3 border-t pt-1 text-[10px] text-muted-foreground">
                                  {svc.uptime && <span>{svc.uptime}</span>}
                                  {svc.goVersion && <span className="font-mono">{svc.goVersion}</span>}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-destructive">{svc.error}</p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ServerPerformancePage;
