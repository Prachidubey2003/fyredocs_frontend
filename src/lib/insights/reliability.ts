import type { ReliabilityData } from '@/lib/adminApi';
import { seriesFrom } from '@/lib/adminTrends';
import type { Insight } from './types';
import { deltaPct, signedPct } from './evaluate';

export function computeReliabilityInsights(data: ReliabilityData | undefined): Insight[] {
  if (!data) return [];
  const out: Insight[] = [];

  const successPct = (data.jobRate?.successRate ?? 0) * 100;
  const { failed = 0, total = 0 } = data.jobRate ?? {};

  if (total > 0) {
    if (successPct < 90) {
      out.push({
        id: 'reliability.success-rate-critical',
        domain: 'reliability',
        severity: 'critical',
        title: `Job success rate is ${successPct.toFixed(1)}%`,
        impact: `${failed.toLocaleString()} of ${total.toLocaleString()} jobs failed in this period.`,
        suggestedAction: 'Inspect the failure-category breakdown to find the dominant error class.',
        metricValue: 100 - successPct,
      });
    } else if (successPct < 95) {
      out.push({
        id: 'reliability.success-rate-warning',
        domain: 'reliability',
        severity: 'warning',
        title: `Success rate dipped to ${successPct.toFixed(1)}%`,
        impact: `${failed.toLocaleString()} failed jobs — below the 95% target.`,
        suggestedAction: 'Review failures by tool to isolate the regressing converter.',
        metricValue: 95 - successPct,
      });
    } else if (successPct >= 99) {
      out.push({
        id: 'reliability.success-rate-healthy',
        domain: 'reliability',
        severity: 'positive',
        title: `Success rate is strong at ${successPct.toFixed(1)}%`,
        impact: `Only ${failed.toLocaleString()} failed jobs across ${total.toLocaleString()}.`,
        suggestedAction: 'No action needed — reliability is within target.',
        metricValue: successPct,
      });
    }
  }

  const failureSeries = seriesFrom(data.errorTrend, (r) => r.failures);
  const failureDelta = deltaPct(failureSeries);
  if (failureDelta != null && failureDelta > 25) {
    out.push({
      id: 'reliability.failures-rising',
      domain: 'reliability',
      severity: failureDelta > 60 ? 'critical' : 'warning',
      title: `Failures rising (${signedPct(failureDelta)})`,
      impact: 'Daily job failures increased over the second half of this period.',
      suggestedAction: 'Correlate the increase with recent deployments and check timeout errors.',
      metricValue: failureDelta,
    });
  }

  const p95 = data.processingTime?.p95Seconds ?? 0;
  if (p95 > 10) {
    out.push({
      id: 'reliability.latency-high',
      domain: 'reliability',
      severity: 'warning',
      title: `P95 processing time is ${p95.toFixed(1)}s`,
      impact: 'Slow jobs degrade the experience and tie up worker capacity.',
      suggestedAction: 'Check worker concurrency and queue depth on the System Health page.',
      metricValue: p95,
    });
  }

  return out;
}
