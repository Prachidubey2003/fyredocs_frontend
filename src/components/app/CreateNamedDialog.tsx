import { useEffect, useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateNamedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  placeholder?: string;
  withColor?: boolean;
  submitting?: boolean;
  onSubmit: (name: string, color?: string) => void | Promise<void>;
}

/** Small dialog for creating a named entity (folder or tag), optional color. */
export function CreateNamedDialog({
  open,
  onOpenChange,
  title,
  label,
  placeholder,
  withColor,
  submitting,
  onSubmit,
}: CreateNamedDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#7c3aed');

  useEffect(() => {
    if (open) {
      setName('');
      setColor('#7c3aed');
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit(trimmed, withColor ? color : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{label}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} autoFocus />
            </div>
            {withColor && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border bg-transparent"
                  aria-label="Tag color"
                />
              </div>
            )}
          </div>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
