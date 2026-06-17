import type { BusinessData } from '@/lib/adminApi';
import { seriesFrom } from '@/lib/adminTrends';
import type { Insight } from './types';
import { deltaPct, signedPct } from './evaluate';

export function computeBusinessInsights(data: BusinessData | undefined): Insight[] {
  if (!data) return [];
  const out: Insight[] = [];

  const churnPct = (data.churn?.churnRate ?? 0) * 100;
  if (churnPct > 10) {
    out.push({
      id: 'business.churn-high',
      domain: 'business',
      severity: churnPct > 20 ? 'critical' : 'warning',
      title: `Churn rate is ${churnPct.toFixed(1)}%`,
      impact: `${(data.churn?.churnedUsers ?? 0).toLocaleString()} users went inactive over the period.`,
      suggestedAction: 'Review onboarding and re-engagement for recently inactive accounts.',
      metricValue: churnPct,
    });
  }

  const signupSeries = seriesFrom(data.signups?.daily, (r) => r.signups);
  const signupDelta = deltaPct(signupSeries);
  if (signupDelta != null) {
    if (signupDelta <= -15) {
      out.push({
        id: 'business.signups-down',
        domain: 'business',
        severity: 'warning',
        title: `Signups slowing (${signedPct(signupDelta)})`,
        impact: 'New-user acquisition declined in the second half of this period.',
        suggestedAction: 'Check acquisition channels on the Growth page for a softening source.',
        metricValue: Math.abs(signupDelta),
      });
    } else if (signupDelta >= 15) {
      out.push({
        id: 'business.signups-up',
        domain: 'business',
        severity: 'positive',
        title: `Signups accelerating (${signedPct(signupDelta)})`,
        impact: `${(data.signups?.total ?? 0).toLocaleString()} signups this period.`,
        suggestedAction: 'Identify the leading channel and double down on it.',
        metricValue: signupDelta,
      });
    }
  }

  const conversionPct = (data.conversionRate?.rate ?? 0) * 100;
  if (data.conversionRate && conversionPct < 2 && (data.signups?.total ?? 0) > 0) {
    out.push({
      id: 'business.conversion-low',
      domain: 'business',
      severity: 'info',
      title: `Free→paid conversion is ${conversionPct.toFixed(1)}%`,
      impact: `${data.conversionRate.freeUpgrades} upgrades from free users.`,
      suggestedAction: 'Test upgrade prompts at plan-limit hit points.',
      metricValue: conversionPct,
    });
  }

  return out;
}
