import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ProgressRing } from '@/components/admin/ProgressRing';
import { AnimatedNumber } from '@/components/admin/AnimatedNumber';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useServerPerformance } from '@/hooks/useAdminMetrics';

const ServerPerformancePage = () => {
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(() => queryClient.resetQueries({ queryKey: ['admin', 'serverPerformance'] }), [queryClient]);
  const { data, isLoading, dataUpdatedAt } = useServerPerformance();
  const d = data;
  const sys = d?.system;
  const avail = d?.availability;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <AdminPageHeader title="Server Performance" description="CPU, memory, storage, and service availability" onRefresh={handleRefresh} />
          <div className="flex items-center gap-2 shrink-0 mt-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-xs text-muted-foreground">
              Live{lastUpdated ? ` \u00b7 ${lastUpdated}` : ''}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <>
            {/* System overview */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="System Uptime" value={sys?.uptime ?? 'N/A'} />
              <Card className="flex flex-col items-center justify-center gap-2 p-4">
                <span className="text-sm text-muted-foreground">CPU</span>
                <ProgressRing value={sys?.cpu?.usagePercent ?? 0} size={72} strokeWidth={7}
                  color={(sys?.cpu?.usagePercent ?? 0) > 80 ? 'hsl(0, 84%, 60%)' : 'hsl(217, 91%, 60%)'} />
                <span className="text-xs text-muted-foreground">{sys?.cpu?.count} cores</span>
              </Card>
              <Card className="flex flex-col items-center justify-center gap-2 p-4">
                <span className="text-sm text-muted-foreground">Memory</span>
                <ProgressRing value={sys?.memory?.usagePercent ?? 0} size={72} strokeWidth={7}
                  color={(sys?.memory?.usagePercent ?? 0) > 80 ? 'hsl(0, 84%, 60%)' : 'hsl(142, 71%, 45%)'} />
                <span className="text-xs text-muted-foreground">
                  <AnimatedNumber value={(sys?.memory?.usedMB ?? 0) / 1024} decimals={1} /> / <AnimatedNumber value={(sys?.memory?.totalMB ?? 0) / 1024} decimals={1} /> GB
                </span>
              </Card>
              <Card className="flex flex-col items-center justify-center gap-2 p-4">
                <span className="text-sm text-muted-foreground">Storage</span>
                <ProgressRing value={sys?.storage?.usagePercent ?? 0} size={72} strokeWidth={7}
                  color={(sys?.storage?.usagePercent ?? 0) > 80 ? 'hsl(0, 84%, 60%)' : 'hsl(262, 83%, 58%)'} />
                <span className="text-xs text-muted-foreground">
                  <AnimatedNumber value={sys?.storage?.usedGB ?? 0} decimals={1} /> / <AnimatedNumber value={sys?.storage?.totalGB ?? 0} decimals={1} /> GB
                </span>
              </Card>
            </div>

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
                    const color = pct > 80 ? 'hsl(0, 84%, 60%)' : pct > 50 ? 'hsl(48, 96%, 53%)' : 'hsl(142, 71%, 45%)';
                    return (
                      <div key={item.label} className="flex flex-col items-center gap-2">
                        <ProgressRing value={pct} size={72} strokeWidth={7} color={color}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {d?.services && Object.entries(d.services).map(([name, svc]) => {
                    const healthy = svc.status === 'healthy';
                    const heapMB = svc.memory?.heapAllocMB ?? 0;
                    const heapPct = Math.min((heapMB / 20) * 100, 100);
                    return (
                      <Card key={name} className={`p-4 border-l-4 ${healthy ? 'border-l-green-500' : 'border-l-red-500'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-medium text-sm">{name}</span>
                          </div>
                          <Badge variant={healthy ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                            {svc.status}
                          </Badge>
                        </div>
                        {healthy ? (
                          <div className="mt-3 space-y-2.5">
                            {svc.goroutines != null && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Goroutines</span>
                                <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                                  <AnimatedNumber value={svc.goroutines} />
                                </Badge>
                              </div>
                            )}
                            {svc.memory && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Heap</span>
                                  <span className="font-medium text-xs"><AnimatedNumber value={heapMB} decimals={1} suffix=" MB" /></span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${heapPct > 80 ? 'bg-red-500' : heapPct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${heapPct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            {(svc.uptime || svc.goVersion) && (
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t">
                                {svc.uptime && <span>{svc.uptime}</span>}
                                {svc.goVersion && <span className="font-mono">{svc.goVersion}</span>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-red-600">{svc.error}</p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ServerPerformancePage;
