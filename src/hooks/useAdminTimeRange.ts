import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const TIME_RANGE_OPTIONS = [7, 30, 90] as const;
export type TimeRangeDays = (typeof TIME_RANGE_OPTIONS)[number];

export const DEFAULT_TIME_RANGE: TimeRangeDays = 30;

function parseDays(raw: string | null): TimeRangeDays {
  const value = Number(raw);
  return (TIME_RANGE_OPTIONS as readonly number[]).includes(value)
    ? (value as TimeRangeDays)
    : DEFAULT_TIME_RANGE;
}

/**
 * Time range for admin metric pages, synced to `?days=7|30|90` so the range
 * survives navigation and deep links. Invalid values fall back to 30.
 */
export function useAdminTimeRange() {
  const [searchParams, setSearchParams] = useSearchParams();
  const days = parseDays(searchParams.get('days'));

  const setDays = useCallback(
    (next: TimeRangeDays) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('days', String(next));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { days, setDays };
}
