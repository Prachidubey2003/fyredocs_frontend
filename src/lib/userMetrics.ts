/**
 * Pure derivations for the user dashboard, computed from the user's job history
 * (each completed job ≈ a processed document). No React, no fetching.
 */

import { getToolById } from '@/config/tools';
import { getNavGroupMeta } from '@/config/navigation';
import type { Insight } from '@/lib/insights';
import type { Job } from '@/types';

export const ACTIVE_STATES: Job['state'][] = ['pending', 'queued', 'processing'];

export function isActive(job: Job): boolean {
  return ACTIVE_STATES.includes(job.state);
}

export function isExpired(job: Job): boolean {
  return job.state === 'completed' && !!job.result && job.result.expiresAt.getTime() <= Date.now();
}

/** Human-readable byte size. */
export function formatBytes(bytes: number | undefined | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${i === 0 ? Math.round(val) : val.toFixed(1)} ${units[i]}`;
}

export interface DashboardSummary {
  total: number;
  processed: number;
  active: number;
  failed: number;
  storageBytes: number;
}

export function summarize(jobs: Job[]): DashboardSummary {
  let processed = 0;
  let active = 0;
  let failed = 0;
  let storageBytes = 0;
  for (const j of jobs) {
    if (j.state === 'completed') {
      processed += 1;
      if (j.result && !isExpired(j)) storageBytes += j.result.fileSize;
    } else if (j.state === 'failed') {
      failed += 1;
    } else if (isActive(j)) {
      active += 1;
    }
  }
  return { total: jobs.length, processed, active, failed, storageBytes };
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Per-day created/processed counts over the last `days` days (oldest→newest). */
export function dailySeries(
  jobs: Job[],
  days = 30,
  now: Date = new Date(),
): { date: string; created: number; processed: number }[] {
  const buckets = new Map<string, { date: string; created: number; processed: number }>();
  const order: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = dateKey(d);
    buckets.set(key, { date: key, created: 0, processed: 0 });
    order.push(key);
  }
  for (const j of jobs) {
    const k = dateKey(j.createdAt);
    const b = buckets.get(k);
    if (!b) continue;
    b.created += 1;
    if (j.state === 'completed') b.processed += 1;
  }
  return order.map((k) => buckets.get(k)!);
}

/** Document counts grouped by user-facing tool category. */
export function categoryBreakdown(jobs: Job[]): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const tool = getToolById(j.toolId);
    if (!tool) continue;
    const label = getNavGroupMeta(tool.navGroup).shortTitle;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/** Status distribution for the doughnut. */
export function statusBreakdown(jobs: Job[]): { name: string; value: number }[] {
  const s = summarize(jobs);
  return [
    { name: 'Completed', value: s.processed },
    { name: 'Active', value: s.active },
    { name: 'Failed', value: s.failed },
  ].filter((d) => d.value > 0);
}

/** Storage used per category (completed, non-expired outputs). */
export function storageByCategory(jobs: Job[]): { name: string; bytes: number }[] {
  const map = new Map<string, number>();
  for (const j of jobs) {
    if (j.state !== 'completed' || !j.result || isExpired(j)) continue;
    const tool = getToolById(j.toolId);
    const label = tool ? getNavGroupMeta(tool.navGroup).shortTitle : 'Other';
    map.set(label, (map.get(label) ?? 0) + j.result.fileSize);
  }
  return [...map.entries()].map(([name, bytes]) => ({ name, bytes })).sort((a, b) => b.bytes - a.bytes);
}

export interface ActivityItem {
  id: string;
  job: Job;
  verb: 'processed' | 'failed' | 'started';
  at: Date;
}

/** Recent activity entries, newest first. */
export function activityFeed(jobs: Job[], limit = 8): ActivityItem[] {
  return [...jobs]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit)
    .map((job) => ({
      id: job.id,
      job,
      verb: job.state === 'completed' ? 'processed' : job.state === 'failed' ? 'failed' : 'started',
      at: job.completedAt ?? job.updatedAt,
    }));
}

/** Threshold/heuristic insights from the user's own activity. */
export function userInsights(jobs: Job[]): Insight[] {
  const out: Insight[] = [];
  if (jobs.length === 0) return out;
  const s = summarize(jobs);

  // Processed this week.
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = jobs.filter((j) => j.state === 'completed' && j.createdAt.getTime() >= weekAgo).length;
  if (thisWeek > 0) {
    out.push({
      id: 'user.processed-week',
      domain: 'engagement',
      severity: 'positive',
      title: `Processed ${thisWeek} document${thisWeek === 1 ? '' : 's'} this week`,
      impact: `${s.processed} processed all-time across your account.`,
      suggestedAction: 'Keep going — your recent files are in Documents.',
      metricValue: thisWeek,
    });
  }

  // Dominant document type.
  const cats = categoryBreakdown(jobs);
  if (cats.length && s.total > 0) {
    const top = cats[0];
    const pct = Math.round((top.count / s.total) * 100);
    if (pct >= 40) {
      out.push({
        id: 'user.dominant-type',
        domain: 'engagement',
        severity: 'info',
        title: `${top.category} is ${pct}% of your activity`,
        impact: `${top.count} of ${s.total} documents.`,
        suggestedAction: `Pin your most-used ${top.category} tools for faster access.`,
        metricValue: pct,
      });
    }
  }

  // Failures need attention.
  if (s.failed > 0) {
    out.push({
      id: 'user.failed',
      domain: 'reliability',
      severity: s.failed >= 3 ? 'warning' : 'info',
      title: `${s.failed} document${s.failed === 1 ? '' : 's'} require attention`,
      impact: 'These jobs failed and produced no output.',
      suggestedAction: 'Open Documents → Failed to retry them.',
      metricValue: s.failed,
    });
  }

  // Expiring soon.
  const dayMs = 24 * 60 * 60 * 1000;
  const expiring = jobs.filter(
    (j) => j.state === 'completed' && j.result && !isExpired(j) && j.result.expiresAt.getTime() - Date.now() <= dayMs,
  ).length;
  if (expiring > 0) {
    out.push({
      id: 'user.expiring',
      domain: 'reliability',
      severity: 'warning',
      title: `${expiring} file${expiring === 1 ? '' : 's'} expiring within 24h`,
      impact: 'Processed outputs are removed after your plan’s retention window.',
      suggestedAction: 'Download them before they expire.',
      metricValue: expiring,
    });
  }

  return out;
}
