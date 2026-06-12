import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface StickyActionBarProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryIcon?: ReactNode;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Optional status hint shown next to the actions (e.g. "Uploading…"). */
  hint?: string;
  className?: string;
}

/**
 * Primary action bar: inline under the panels on desktop, fixed to the bottom
 * edge with safe-area padding on mobile.
 */
export const StickyActionBar = ({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryIcon,
  secondaryLabel,
  onSecondary,
  hint,
  className,
}: StickyActionBarProps) => {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
        'sm:static sm:z-auto sm:rounded-xl sm:border sm:pb-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {hint && (
          <Text variant="body-sm" tone="muted" as="span" className="hidden md:block">
            {hint}
          </Text>
        )}
        <div className="ml-auto flex w-full items-center gap-3 sm:w-auto">
          {secondaryLabel && onSecondary && (
            <Button variant="outline" onClick={onSecondary} className="flex-1 sm:flex-none">
              {secondaryLabel}
            </Button>
          )}
          <Button
            variant="gradient"
            size="lg"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className="flex-1 sm:flex-none"
          >
            {primaryIcon}
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
