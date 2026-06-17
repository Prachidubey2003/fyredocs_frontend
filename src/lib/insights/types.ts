/**
 * Rule-based insight engine. Each domain module turns fetched metrics into a
 * list of plain-language insights with a severity, an impact statement, and a
 * suggested action — answering "what happened / why does it matter / what now".
 *
 * Modules are pure functions of their data and return `[]` for missing or
 * insufficient data, so the UI degrades gracefully before/around the backend.
 */

export type InsightDomain =
  | 'business'
  | 'growth'
  | 'engagement'
  | 'reliability'
  | 'system'
  | 'server'
  | 'api';

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'positive';

export interface Insight {
  /** Stable id, e.g. 'reliability.success-rate-low'. */
  id: string;
  domain: InsightDomain;
  severity: InsightSeverity;
  /** Short headline — what happened. */
  title: string;
  /** Quantified consequence — why it matters. */
  impact: string;
  /** Recommended next step. */
  suggestedAction: string;
  /** Magnitude used to rank within a severity tier (abs value). */
  metricValue?: number;
}

/** Section route for each domain — used for drill-down links from insights. */
export const DOMAIN_PATH: Record<InsightDomain, string> = {
  business: '/admin/business',
  growth: '/admin/growth',
  engagement: '/admin/engagement',
  reliability: '/admin/reliability',
  system: '/admin/system',
  server: '/admin/server-performance',
  api: '/admin/api-performance',
};

export const DOMAIN_LABEL: Record<InsightDomain, string> = {
  business: 'Business',
  growth: 'Growth',
  engagement: 'Engagement',
  reliability: 'Reliability',
  system: 'System Health',
  server: 'Server',
  api: 'API',
};

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
};

/** Sort by severity (critical first), then by magnitude descending. */
export function sortInsights(insights: Insight[]): Insight[] {
  return [...insights].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return (b.metricValue ?? 0) - (a.metricValue ?? 0);
  });
}
