import { computeDelta } from '@/lib/adminTrends';

/**
 * Half-over-half percentage change of a series, or null when there is not
 * enough data. Thin wrapper over the shared trend helper so insight rules and
 * trend chips agree on the same math.
 */
export function deltaPct(series: number[]): number | null {
  const delta = computeDelta(series);
  return delta ? delta.deltaPct : null;
}

/** Percentage change between two scalar values; null on a zero/absent baseline. */
export function changePct(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Format a signed percentage, e.g. 4.2 → "+4.2%". */
export function signedPct(value: number, decimals = 1): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}
