import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ProgressRing } from '@/components/admin/ProgressRing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useServerPerformance } from '@/hooks/useAdminMetrics';

const ServerPerformancePage = () => {
  const { data, isLoading } = useServerPerformance();
  const d = data?.data;
  const sys = d?.system;
  const avail = d?.availability;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <AdminPageHeader title="Server Performance" description="CPU, memory, storage, and service availability" />

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
                  {((sys?.memory?.usedMB ?? 0) / 1024).toFixed(1)} / {((sys?.memory?.totalMB ?? 0) / 1024).toFixed(1)} GB
                </span>
              </Card>
              <Card className="flex flex-col items-center justify-center gap-2 p-4">
                <span className="text-sm text-muted-foreground">Storage</span>
                <ProgressRing value={sys?.storage?.usagePercent ?? 0} size={72} strokeWidth={7}
                  color={(sys?.storage?.usagePercent ?? 0) > 80 ? 'hsl(0, 84%, 60%)' : 'hsl(262, 83%, 58%)'} />
                <span className="text-xs text-muted-foreground">
                  {(sys?.storage?.usedGB ?? 0).toFixed(1)} / {(sys?.storage?.totalGB ?? 0).toFixed(1)} GB
                </span>
              </Card>
            </div>

            {/* Load averages */}
            <Card>
              <CardHeader>
                <CardTitle>Load Averages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">1 min</p>
                    <p className="text-2xl font-bold">{(sys?.cpu?.loadAvg1m ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">5 min</p>
                    <p className="text-2xl font-bold">{(sys?.cpu?.loadAvg5m ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">15 min</p>
                    <p className="text-2xl font-bold">{(sys?.cpu?.loadAvg15m ?? 0).toFixed(2)}</p>
                  </div>
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
                  <span className="font-medium">{((sys?.memory?.usedMB ?? 0) / 1024).toFixed(2)} GB</span>
                </div>
                <Progress value={sys?.memory?.usagePercent ?? 0} />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">{((sys?.memory?.totalMB ?? 0) / 1024).toFixed(2)} GB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Free</p>
                    <p className="font-medium">{((sys?.memory?.freeMB ?? 0) / 1024).toFixed(2)} GB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="font-medium">{((sys?.memory?.availableMB ?? 0) / 1024).toFixed(2)} GB</p>
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {d?.services && Object.entries(d.services).map(([name, svc]) => (
                    <Card key={name} className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{name}</span>
                        <Badge variant={svc.status === 'healthy' ? 'default' : 'destructive'}>
                          {svc.status}
                        </Badge>
                      </div>
                      {svc.status === 'healthy' ? (
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          {svc.goroutines != null && <p>Goroutines: <span className="font-medium text-foreground">{svc.goroutines}</span></p>}
                          {svc.memory && <p>Heap: <span className="font-medium text-foreground">{svc.memory.heapAllocMB?.toFixed(1)} MB</span></p>}
                          {svc.uptime && <p>Uptime: <span className="font-medium text-foreground">{svc.uptime}</span></p>}
                          {svc.goVersion && <p>Go: <span className="font-medium text-foreground">{svc.goVersion}</span></p>}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-red-600">{svc.error}</p>
                      )}
                    </Card>
                  ))}
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
