import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { useAuth } from '@/auth/useAuth';
import { usePlan } from '@/hooks/usePlans';
import { cn } from '@/lib/utils';

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

const formatRemaining = (minutes: number): string => {
  const days = Math.floor(minutes / MINUTES_PER_DAY);
  const hours = Math.floor((minutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) {
    const mins = minutes % MINUTES_PER_HOUR;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${Math.max(minutes, 1)}m`;
};

export interface RetentionCountdownProps {
  expiresAt: Date;
  className?: string;
}

/**
 * "Expires in 2d 4h" countdown from a job's result.expiresAt.
 * Warns (text-warning) under 24h, shows "Expired" past the deadline, and
 * nudges non-Pro users towards /pricing.
 */
export function RetentionCountdown({ expiresAt, className }: RetentionCountdownProps) {
  const { plan } = useAuth();
  const { plan: proPlan } = usePlan('pro');

  const minutesLeft = differenceInMinutes(expiresAt, new Date());
  const expired = minutesLeft <= 0;
  const expiringSoon = !expired && minutesLeft < MINUTES_PER_DAY;
  const proRetentionDays = proPlan?.retentionDays ?? 30;

  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption',
        expiringSoon ? 'text-warning' : 'text-muted-foreground',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3 shrink-0" aria-hidden />
        {expired ? 'Expired' : `Expires in ${formatRemaining(minutesLeft)}`}
      </span>
      {plan !== 'pro' && (
        <Link to="/pricing" className="font-medium text-primary underline-offset-2 hover:underline">
          Pro keeps files {proRetentionDays} days — Upgrade
        </Link>
      )}
    </span>
  );
}
