import type { GrowthData } from '@/lib/adminApi';
import { seriesFrom } from '@/lib/adminTrends';
import type { Insight } from './types';
import { deltaPct, signedPct } from './evaluate';

export function computeGrowthInsights(data: GrowthData | undefined): Insight[] {
  if (!data) return [];
  const out: Insight[] = [];

  const stickinessPct = (data.stickiness ?? 0) * 100;
  if (data.mau > 0) {
    if (stickinessPct < 10) {
      out.push({
        id: 'growth.stickiness-low',
        domain: 'growth',
        severity: 'warning',
        title: `Stickiness is ${stickinessPct.toFixed(1)}%`,
        impact: 'Low DAU/MAU means users return infrequently after signing up.',
        suggestedAction: 'Prioritise habit-forming features and activation nudges.',
        metricValue: 20 - stickinessPct,
      });
    } else if (stickinessPct >= 20) {
      out.push({
        id: 'growth.stickiness-strong',
        domain: 'growth',
        severity: 'positive',
        title: `Stickiness is healthy at ${stickinessPct.toFixed(1)}%`,
        impact: 'Daily-to-monthly engagement is strong.',
        suggestedAction: 'Maintain the engagement loop; focus on top-of-funnel growth.',
        metricValue: stickinessPct,
      });
    }
  }

  const dauSeries = seriesFrom(data.dauTrend, (r) => r.dau);
  const dauDelta = deltaPct(dauSeries);
  if (dauDelta != null) {
    if (dauDelta <= -15) {
      out.push({
        id: 'growth.dau-down',
        domain: 'growth',
        severity: 'warning',
        title: `DAU declining (${signedPct(dauDelta)})`,
        impact: 'Daily active users dropped over the second half of the period.',
        suggestedAction: 'Check reliability and recent releases for engagement regressions.',
        metricValue: Math.abs(dauDelta),
      });
    } else if (dauDelta >= 14) {
      out.push({
        id: 'growth.dau-up',
        domain: 'growth',
        severity: 'positive',
        title: `DAU growing (${signedPct(dauDelta)})`,
        impact: `Now at ${data.dau.toLocaleString()} daily active users.`,
        suggestedAction: 'Capitalise on momentum — ensure infra capacity keeps pace.',
        metricValue: dauDelta,
      });
    }
  }

  const activationPct = (data.activationRate?.rate ?? 0) * 100;
  if (data.activationRate && data.activationRate.signups > 0 && activationPct < 40) {
    out.push({
      id: 'growth.activation-low',
      domain: 'growth',
      severity: 'info',
      title: `Activation rate is ${activationPct.toFixed(0)}%`,
      impact: `${data.activationRate.activated} of ${data.activationRate.signups} new users completed a first job.`,
      suggestedAction: 'Streamline first-run flow to lift activation.',
      metricValue: 40 - activationPct,
    });
  }

  return out;
}
