import type { ServerPerformanceData } from '@/lib/adminApi';
import type { Insight } from './types';

const RESOURCES: { key: 'cpu' | 'memory' | 'disk'; label: string; pick: (d: ServerPerformanceData) => number }[] = [
  { key: 'cpu', label: 'CPU', pick: (d) => d.system?.cpu?.usagePercent ?? 0 },
  { key: 'memory', label: 'Memory', pick: (d) => d.system?.memory?.usagePercent ?? 0 },
  { key: 'disk', label: 'Disk', pick: (d) => d.system?.storage?.usagePercent ?? 0 },
];

export function computeServerInsights(data: ServerPerformanceData | undefined): Insight[] {
  if (!data) return [];
  const out: Insight[] = [];

  for (const r of RESOURCES) {
    const pct = r.pick(data);
    if (pct > 80) {
      out.push({
        id: `server.${r.key}-critical`,
        domain: 'server',
        severity: 'critical',
        title: `${r.label} usage at ${pct.toFixed(0)}%`,
        impact: `${r.label} is approaching saturation and risks degraded performance.`,
        suggestedAction:
          r.key === 'disk' ? 'Free disk space or expand the volume.' : 'Scale out or investigate the load source.',
        metricValue: pct,
      });
    } else if (pct > 60) {
      out.push({
        id: `server.${r.key}-warning`,
        domain: 'server',
        severity: 'warning',
        title: `${r.label} usage elevated at ${pct.toFixed(0)}%`,
        impact: `${r.label} headroom is shrinking.`,
        suggestedAction: 'Monitor the trend and plan capacity if it continues to climb.',
        metricValue: pct,
      });
    }
  }

  const unhealthy = data.availability?.unhealthyServices ?? 0;
  if (unhealthy > 0) {
    const names = Object.entries(data.services ?? {})
      .filter(([, s]) => s.status !== 'healthy')
      .map(([name]) => name);
    out.push({
      id: 'server.services-unhealthy',
      domain: 'server',
      severity: 'critical',
      title: `${unhealthy} service${unhealthy > 1 ? 's' : ''} unhealthy`,
      impact: names.length ? `Affected: ${names.join(', ')}.` : 'One or more services failed their health check.',
      suggestedAction: 'Check service logs and restart unhealthy instances.',
      metricValue: 100 + unhealthy,
    });
  }

  return out;
}
