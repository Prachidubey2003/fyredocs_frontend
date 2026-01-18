import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layers, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BatchModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  fileCount: number;
  className?: string;
}

export const BatchModeToggle = ({
  enabled,
  onToggle,
  fileCount,
  className,
}: BatchModeToggleProps) => {
  // Only show toggle when there are multiple files
  if (fileCount <= 1) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border bg-muted/30',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {enabled ? (
          <Layers className="w-5 h-5 text-primary" />
        ) : (
          <FileText className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <Label htmlFor="batch-mode" className="font-medium cursor-pointer">
            Batch Processing
          </Label>
          <p className="text-sm text-muted-foreground">
            {enabled
              ? `Process ${fileCount} files separately, each producing its own output`
              : 'Combine all files into a single operation'}
          </p>
        </div>
      </div>
      <Switch
        id="batch-mode"
        checked={enabled}
        onCheckedChange={onToggle}
      />
    </div>
  );
};
