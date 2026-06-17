import type { EngagementData } from '@/lib/adminApi';
import type { Insight } from './types';

export function computeEngagementInsights(data: EngagementData | undefined): Insight[] {
  if (!data) return [];
  const out: Insight[] = [];

  const avg = data.jobsPerUser?.average ?? 0;
  const median = data.jobsPerUser?.median ?? 0;
  if (avg > 0 && median > 0 && avg > median * 2.5) {
    out.push({
      id: 'engagement.usage-skewed',
      domain: 'engagement',
      severity: 'info',
      title: 'Usage is concentrated in a few power users',
      impact: `Average ${avg.toFixed(1)} jobs/user vs a median of ${median.toFixed(1)} — a long tail of light users.`,
      suggestedAction: 'Target casual users with templates and re-engagement to broaden adoption.',
      metricValue: avg - median,
    });
  }

  const guestRatio = (data.guestVsRegistered?.guestRatio ?? 0) * 100;
  if (guestRatio > 60) {
    out.push({
      id: 'engagement.guest-heavy',
      domain: 'engagement',
      severity: 'info',
      title: `${guestRatio.toFixed(0)}% of activity is from guests`,
      impact: 'A large share of usage comes from unregistered sessions.',
      suggestedAction: 'Add sign-up incentives at the end of guest workflows to convert them.',
      metricValue: guestRatio,
    });
  }

  return out;
}
