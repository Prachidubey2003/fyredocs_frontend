import { RotateCw, RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { OptionsPanelProps } from './types';

type RotationDegree = 90 | 180 | 270;
type ApplyTo = 'all' | 'odd' | 'even';

export const RotateOptionsPanel = ({ form, pageCount }: OptionsPanelProps) => {
  const rotation = Number(form.watch('rotation') ?? 90) as RotationDegree;
  const applyTo = (form.watch('applyToPages') as ApplyTo) ?? 'all';

  const setRotation = (value: RotationDegree) =>
    form.setValue('rotation', value, { shouldValidate: true });

  const rotationButtonClass = (value: RotationDegree) =>
    cn(
      'flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-colors',
      rotation === value ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/50'
    );

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-h4 font-semibold">
          <RotateCw className="h-5 w-5" aria-hidden />
          Rotation Settings
        </h3>
        {pageCount !== null && (
          <Text variant="body-sm" tone="muted" as="span">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </Text>
        )}
      </div>

      <div className="space-y-4">
        <Label>Rotation Angle</Label>
        <div className="grid grid-cols-3 gap-4">
          <button type="button" onClick={() => setRotation(90)} className={rotationButtonClass(90)}>
            <RotateCw className="mb-2 h-8 w-8" aria-hidden />
            <span className="font-medium">90°</span>
            <span className="text-caption text-muted-foreground">Clockwise</span>
          </button>
          <button type="button" onClick={() => setRotation(180)} className={rotationButtonClass(180)}>
            <div className="mb-2 flex gap-1">
              <RotateCw className="h-6 w-6" aria-hidden />
              <RotateCw className="h-6 w-6" aria-hidden />
            </div>
            <span className="font-medium">180°</span>
            <span className="text-caption text-muted-foreground">Upside Down</span>
          </button>
          <button type="button" onClick={() => setRotation(270)} className={rotationButtonClass(270)}>
            <RotateCcw className="mb-2 h-8 w-8" aria-hidden />
            <span className="font-medium">270°</span>
            <span className="text-caption text-muted-foreground">Counter-clockwise</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Apply To</Label>
        <RadioGroup
          value={applyTo}
          onValueChange={(v) => form.setValue('applyToPages', v as ApplyTo, { shouldValidate: true })}
          className="grid grid-cols-3 gap-4"
        >
          <Label
            htmlFor="rotate-all-pages"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroupItem value="all" id="rotate-all-pages" className="sr-only" />
            <span className="font-medium">All Pages</span>
            <span className="text-caption text-muted-foreground">Rotate every page</span>
          </Label>
          <Label
            htmlFor="rotate-odd-pages"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroupItem value="odd" id="rotate-odd-pages" className="sr-only" />
            <span className="font-medium">Odd Pages</span>
            <span className="text-caption text-muted-foreground">1, 3, 5, 7...</span>
          </Label>
          <Label
            htmlFor="rotate-even-pages"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroupItem value="even" id="rotate-even-pages" className="sr-only" />
            <span className="font-medium">Even Pages</span>
            <span className="text-caption text-muted-foreground">2, 4, 6, 8...</span>
          </Label>
        </RadioGroup>
      </div>
    </div>
  );
};
