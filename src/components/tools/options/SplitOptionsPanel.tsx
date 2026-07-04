import { Scissors } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AnimatedCollapse } from '@/components/ui/animated';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';

type SplitMode = 'all' | 'range' | 'extract' | 'equal';

const MODE_CARD_CLASSES =
  'flex items-start space-x-3 p-4 rounded-lg border-2 border-muted hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-gradient-to-r has-[[data-state=checked]]:from-primary/5 has-[[data-state=checked]]:to-secondary/5 transition-colors cursor-pointer';

export const SplitOptionsPanel = ({ form, pageCount }: OptionsPanelProps) => {
  const mode = (form.watch('mode') as SplitMode) ?? 'all';
  const range = (form.watch('range') as string) ?? '';
  const span = form.watch('span');
  const errors = form.formState.errors;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <Scissors className="h-5 w-5 text-primary" aria-hidden />
          Split Options
        </h3>
        {pageCount !== null && (
          <Text variant="body-sm" tone="muted" as="span">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </Text>
        )}
      </div>

      <RadioGroup
        value={mode}
        onValueChange={(value) => form.setValue('mode', value as SplitMode, { shouldValidate: true })}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className={MODE_CARD_CLASSES}>
          <RadioGroupItem value="all" id="split-all" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="split-all" className="cursor-pointer font-medium">
              Split all pages
            </Label>
            <Text variant="body-sm" tone="muted">
              Extract each page as a separate PDF file
            </Text>
          </div>
        </div>

        <div className={MODE_CARD_CLASSES}>
          <RadioGroupItem value="range" id="split-range" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="split-range" className="cursor-pointer font-medium">
              Split by range
            </Label>
            <Text variant="body-sm" tone="muted" className="mb-3">
              Specify page ranges to extract
            </Text>
            <AnimatedCollapse show={mode === 'range'}>
              <Input
                placeholder="e.g., 1-3, 5, 7-10"
                value={range}
                onChange={(e) => form.setValue('range', e.target.value, { shouldValidate: true })}
                className="max-w-xs"
                aria-label="Page range"
              />
              {errors.range && (
                <p className="mt-1.5 text-caption text-destructive">{String(errors.range.message)}</p>
              )}
            </AnimatedCollapse>
          </div>
        </div>

        <div className={MODE_CARD_CLASSES}>
          <RadioGroupItem value="extract" id="split-extract" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="split-extract" className="cursor-pointer font-medium">
              Split by page count
            </Label>
            <Text variant="body-sm" tone="muted" className="mb-3">
              Split into PDFs with a fixed number of pages each
            </Text>
            <AnimatedCollapse show={mode === 'extract'}>
              <Input
                type="number"
                min="1"
                placeholder="e.g., 3"
                value={String(span ?? '')}
                onChange={(e) => form.setValue('span', e.target.value, { shouldValidate: true })}
                className="max-w-xs"
                aria-label="Pages per chunk"
              />
              {mode === 'extract' && errors.span && (
                <p className="mt-1.5 text-caption text-destructive">{String(errors.span.message)}</p>
              )}
            </AnimatedCollapse>
          </div>
        </div>

        <div className={MODE_CARD_CLASSES}>
          <RadioGroupItem value="equal" id="split-equal" className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="split-equal" className="cursor-pointer font-medium">
              Split into equal parts
            </Label>
            <Text variant="body-sm" tone="muted" className="mb-3">
              Divide the PDF into a specified number of equal PDFs
            </Text>
            <AnimatedCollapse show={mode === 'equal'}>
              <Input
                type="number"
                min="2"
                placeholder="e.g., 4"
                value={String(span ?? '')}
                onChange={(e) => form.setValue('span', e.target.value, { shouldValidate: true })}
                className="max-w-xs"
                aria-label="Number of parts"
              />
              {mode === 'equal' && errors.span && (
                <p className="mt-1.5 text-caption text-destructive">{String(errors.span.message)}</p>
              )}
            </AnimatedCollapse>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};
