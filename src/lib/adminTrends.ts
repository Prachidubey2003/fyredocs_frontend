/**
 * Trend helpers for admin metrics.
 *
 * `computeDelta` compares the first and second halves of a series; it returns
 * null when there is not enough data (or a zero baseline) so the UI can omit
 * the trend chip instead of showing a fake one.
 */

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendDelta {
  deltaPct: number;
  direction: TrendDirection;
}

const FLAT_THRESHOLD_PCT = 0.5;

export function computeDelta(series: number[]): TrendDelta | null {
  if (series.length < 4) return null;

  const mid = Math.floor(series.length / 2);
  const baseline = series.slice(0, mid).reduce((sum, v) => sum + v, 0);
  const recent = series.slice(mid).reduce((sum, v) => sum + v, 0);

  if (baseline === 0) return null;

  const deltaPct = ((recent - baseline) / baseline) * 100;
  const direction: TrendDirection =
    Math.abs(deltaPct) < FLAT_THRESHOLD_PCT ? 'flat' : deltaPct > 0 ? 'up' : 'down';

  return { deltaPct, direction };
}

/** Extracts a numeric series from a list of items (tolerates undefined lists). */
export function seriesFrom<T>(items: T[] | null | undefined, pick: (item: T) => number): number[] {
  return (items ?? []).map(pick);
}
