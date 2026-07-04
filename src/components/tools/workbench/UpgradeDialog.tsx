import { Link } from 'react-router-dom';
import { Sparkles, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';
import { usePlan } from '@/hooks/usePlans';
import { PlanLimitReason } from '@/components/common/PlanAwareFileDropzone';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: PlanLimitReason;
}

/**
 * Shown when a file selection violates the user's plan limits.
 * Guest users are nudged to create a free account; free users to Pro.
 */
export const UpgradeDialog = ({ open, onOpenChange, reason }: UpgradeDialogProps) => {
  const { plan } = useAuth();
  const { plan: freePlan } = usePlan('free');
  const { plan: proPlan } = usePlan('pro');
  const isGuest = plan === 'guest';

  const reasonCopy =
    reason === 'fileCount'
      ? 'You have reached the maximum number of files for your current plan.'
      : 'One of your files exceeds the maximum file size for your current plan.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            {isGuest ? 'Create a free account' : 'Upgrade to Pro'}
          </DialogTitle>
          <DialogDescription>{reasonCopy}</DialogDescription>
        </DialogHeader>

        {isGuest ? (
          <ul className="space-y-2 text-body-sm">
            {freePlan && (
              <>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  Files up to {freePlan.maxFileSizeMb}MB
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  Up to {freePlan.maxFilesPerJob} files per job
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  Files kept for {freePlan.retentionDays} {freePlan.retentionDays === 1 ? 'day' : 'days'}
                </li>
              </>
            )}
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" aria-hidden />
              Free forever — no credit card required
            </li>
          </ul>
        ) : (
          <ul className="space-y-2 text-body-sm">
            {proPlan && (
              <>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  Files up to {proPlan.maxFileSizeMb}MB
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  Up to {proPlan.maxFilesPerJob} files per job
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  Files kept for {proPlan.retentionDays} days
                </li>
              </>
            )}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild variant="gradient">
            <Link to={isGuest ? '/signup' : '/pricing'}>
              {isGuest ? 'Create a free account' : 'Upgrade to Pro'}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
