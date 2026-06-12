import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TIME_RANGE_OPTIONS,
  useAdminTimeRange,
  type TimeRangeDays,
} from '@/hooks/useAdminTimeRange';

/** Range selector bound to the `?days=` search param. */
export function TimeRangeSelect() {
  const { days, setDays } = useAdminTimeRange();

  return (
    <Select value={String(days)} onValueChange={(value) => setDays(Number(value) as TimeRangeDays)}>
      <SelectTrigger className="h-9 w-[140px]" aria-label="Time range">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {TIME_RANGE_OPTIONS.map((option) => (
          <SelectItem key={option} value={String(option)}>
            Last {option} days
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
