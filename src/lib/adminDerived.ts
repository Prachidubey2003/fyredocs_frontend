/**
 * Client-side derivations used by the admin dashboard when the backend serves
 * raw series rather than pre-shaped chart data. Pure functions, no React.
 */

import type { EngagementData, ReliabilityData } from '@/lib/adminApi';
import type { HealthStatus } from '@/components/admin/chartTheme';

/** Percentage change between two scalars; null on a zero/absent baseline. */
export function kpiDelta(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Map a success-rate percentage (0–100) to a health status. */
export function rateStatus(pct: number, good = 95, warn = 90): HealthStatus {
  if (pct >= good) return 'healthy';
  if (pct >= warn) return 'warning';
  return 'critical';
}

/** Map a utilization/error percentage (0–100, lower is better) to a status. */
export function usageStatus(pct: number, warn = 60, bad = 80): HealthStatus {
  if (pct > bad) return 'critical';
  if (pct > warn) return 'warning';
  return 'healthy';
}

/**
 * Pivot the long-format tool trend rows into one record per date with a column
 * per tool, keeping only the top-N tools by total volume.
 */
export function pivotToolTrends(
  rows: EngagementData['toolTrends'] | undefined,
  topN = 4,
): { data: Record<string, number | string>[]; tools: string[] } {
  if (!rows?.length) return { data: [], tools: [] };

  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.toolType, (totals.get(r.toolType) ?? 0) + r.count);
  const tools = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([tool]) => tool);

  const byDate = new Map<string, Record<string, number | string>>();
  for (const r of rows) {
    if (!tools.includes(r.toolType)) continue;
    const row = byDate.get(r.date) ?? { date: r.date };
    row[r.toolType] = ((row[r.toolType] as number) ?? 0) + r.count;
    byDate.set(r.date, row);
  }

  const data = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  // Backfill missing tool keys with 0 so lines connect.
  for (const row of data) for (const t of tools) if (row[t] == null) row[t] = 0;

  return { data, tools };
}

export interface UserSegment {
  name: string;
  value: number;
}

/**
 * Segment users from the power-user job-count distribution. Thresholds:
 * power ≥ 20 jobs, active ≥ 5, casual ≥ 1. "Dormant" is shown only when a
 * registered-user total is known to be larger than the active set.
 */
export function segmentUsers(data: EngagementData | undefined): UserSegment[] {
  if (!data?.powerUsers?.length) return [];
  let power = 0;
  let active = 0;
  let casual = 0;
  for (const u of data.powerUsers) {
    if (u.jobCount >= 20) power += 1;
    else if (u.jobCount >= 5) active += 1;
    else casual += 1;
  }

  const known = power + active + casual;
  const registered = data.guestVsRegistered?.uniqueRegistered ?? 0;
  const dormant = Math.max(registered - known, 0);

  return [
    { name: 'Power', value: power },
    { name: 'Active', value: active },
    { name: 'Casual', value: casual },
    { name: 'Dormant', value: dormant },
  ].filter((s) => s.value > 0);
}

/**
 * Build daily success / failure / completion-rate percentages from the
 * reliability error trend (failures and totals per day).
 */
export function reliabilityRateTrend(
  data: ReliabilityData | undefined,
): { date: string; successRate: number; failureRate: number }[] {
  if (!data?.errorTrend?.length) return [];
  return data.errorTrend.map((r) => {
    const total = r.total || 0;
    const failureRate = total > 0 ? (r.failures / total) * 100 : 0;
    return {
      date: r.date,
      successRate: total > 0 ? 100 - failureRate : 100,
      failureRate,
    };
  });
}
