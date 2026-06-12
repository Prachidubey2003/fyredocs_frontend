import { useMemo } from 'react';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { Text } from '@/components/ui/typography';
import { JobHistoryItem } from './JobHistoryItem';
import type { Job } from '@/types';

const dayLabel = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'd MMMM yyyy');
};

export interface JobHistoryListProps {
  jobs: Job[];
  onDelete: (job: Job) => void | Promise<void>;
}

/** Jobs grouped by day (Today / Yesterday / date), newest first. */
export function JobHistoryList({ jobs, onDelete }: JobHistoryListProps) {
  const groups = useMemo(() => {
    const sorted = [...jobs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const byDay = new Map<number, Job[]>();
    for (const job of sorted) {
      const key = startOfDay(job.createdAt).getTime();
      const bucket = byDay.get(key);
      if (bucket) {
        bucket.push(job);
      } else {
        byDay.set(key, [job]);
      }
    }
    return [...byDay.entries()].map(([timestamp, dayJobs]) => ({
      date: new Date(timestamp),
      jobs: dayJobs,
    }));
  }, [jobs]);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.date.getTime()} aria-label={dayLabel(group.date)}>
          <Text as="div" variant="overline" tone="muted" className="mb-3">
            {dayLabel(group.date)}
          </Text>
          <ul className="space-y-2">
            {group.jobs.map((job) => (
              <li key={job.id}>
                <JobHistoryItem job={job} onDelete={onDelete} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
