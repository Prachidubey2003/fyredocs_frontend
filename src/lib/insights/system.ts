import type { SystemData } from '@/lib/adminApi';
import type { Insight } from './types';

export function computeSystemInsights(data: SystemData | undefined): Insight[] {
  if (!data) return [];
  const out: Insight[] = [];

  const lag = data.processingLag?.avgSeconds ?? 0;
  const maxLag = data.processingLag?.maxSeconds ?? 0;
  if (lag > 10) {
    out.push({
      id: 'system.lag-high',
      domain: 'system',
      severity: lag > 30 ? 'critical' : 'warning',
      title: `Event processing lag is ${lag.toFixed(1)}s`,
      impact: `Peak lag reached ${maxLag.toFixed(1)}s — analytics may be stale.`,
      suggestedAction: 'Check the analytics consumer and NATS queue depth for a backlog.',
      metricValue: lag,
    });
  } else if (lag > 0 && lag <= 2) {
    out.push({
      id: 'system.lag-healthy',
      domain: 'system',
      severity: 'positive',
      title: 'Event pipeline is keeping up',
      impact: `Average ingestion lag is ${lag.toFixed(2)}s.`,
      suggestedAction: 'No action needed.',
      metricValue: 0,
    });
  }

  if ((data.eventsLastHour ?? 0) === 0 && (data.totalEvents ?? 0) > 0) {
    out.push({
      id: 'system.no-recent-events',
      domain: 'system',
      severity: 'warning',
      title: 'No events ingested in the last hour',
      impact: 'Event flow has stalled despite historical activity.',
      suggestedAction: 'Verify producers are publishing and the analytics subscriber is connected.',
      metricValue: 100,
    });
  }

  return out;
}
