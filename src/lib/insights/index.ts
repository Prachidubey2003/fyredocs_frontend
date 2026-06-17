import type { Insight } from './types';
import { sortInsights } from './types';

export * from './types';
export { computeBusinessInsights } from './business';
export { computeGrowthInsights } from './growth';
export { computeEngagementInsights } from './engagement';
export { computeReliabilityInsights } from './reliability';
export { computeSystemInsights } from './system';
export { computeServerInsights } from './server';
export { computeApiInsights } from './api';

/**
 * Merge per-domain insights for the overview panel: flatten, sort by severity
 * then magnitude, and keep the top N. Pass the (possibly empty) result of each
 * domain's compute function.
 */
export function aggregateInsights(domains: Insight[][], topN = 5): Insight[] {
  return sortInsights(domains.flat()).slice(0, topN);
}
