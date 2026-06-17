import type { ApiPerformanceData } from '@/lib/adminApi';
import type { Insight } from './types';

export function computeApiInsights(data: ApiPerformanceData | undefined): Insight[] {
  if (!data?.summary) return [];
  const out: Insight[] = [];

  const errorPct = (data.summary.errorRate ?? 0) * 100;
  if (errorPct > 5) {
    out.push({
      id: 'api.error-rate-critical',
      domain: 'api',
      severity: 'critical',
      title: `API error rate is ${errorPct.toFixed(1)}%`,
      impact: `Across ${data.summary.totalRequests.toLocaleString()} requests — clients are seeing failures.`,
      suggestedAction: 'Inspect the highest-error endpoints and recent deploys.',
      metricValue: errorPct,
    });
  } else if (errorPct > 1) {
    out.push({
      id: 'api.error-rate-warning',
      domain: 'api',
      severity: 'warning',
      title: `API error rate is ${errorPct.toFixed(1)}%`,
      impact: 'Above the 1% target across recent traffic.',
      suggestedAction: 'Review 5xx responses by endpoint to find the source.',
      metricValue: errorPct,
    });
  }

  const p95 = data.summary.p95LatencyMs ?? 0;
  if (p95 > 1000) {
    out.push({
      id: 'api.latency-high',
      domain: 'api',
      severity: 'warning',
      title: `API P95 latency is ${(p95 / 1000).toFixed(2)}s`,
      impact: 'Slow responses hurt the developer and end-user experience.',
      suggestedAction: 'Profile the slowest endpoints and add caching or indexes.',
      metricValue: p95,
    });
  }

  const worst = data.highestErrorEndpoints?.[0];
  if (worst && worst.errorRate > 0.1) {
    out.push({
      id: 'api.endpoint-erroring',
      domain: 'api',
      severity: 'warning',
      title: `${worst.method} ${worst.path} is failing`,
      impact: `${(worst.errorRate * 100).toFixed(1)}% error rate on ${worst.requests.toLocaleString()} requests.`,
      suggestedAction: 'Triage this endpoint first — it dominates API errors.',
      metricValue: worst.errorRate * 100,
    });
  }

  return out;
}
