import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';

export const ReorderOptionsPanel = ({ form, pageCount }: OptionsPanelProps) => {
  const order = (form.watch('order') as string) ?? '';
  const error = form.formState.errors.order;

  const fillSequential = () => {
    if (pageCount === null) return;
    form.setValue(
      'order',
      Array.from({ length: pageCount }, (_, i) => i + 1).join(','),
      { shouldValidate: true }
    );
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          <ArrowUpDown className="h-5 w-5" aria-hidden />
          Reorder Pages
        </h3>
        {pageCount !== null && (
          <Text variant="body-sm" tone="muted" as="span">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </Text>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="page-order">New page order</Label>
        <Input
          id="page-order"
          placeholder="e.g., 3,1,2,5,4"
          value={order}
          onChange={(e) => form.setValue('order', e.target.value, { shouldValidate: true })}
        />
        {error && <p className="text-caption text-destructive">{String(error.message)}</p>}
        <Text variant="caption" tone="muted">
          Enter every page number in the order you want, separated by commas.
          {pageCount !== null && ` Your PDF has ${pageCount} pages.`}
        </Text>
        {pageCount !== null && (
          <Button type="button" variant="ghost" size="xs" onClick={fillSequential}>
            Prefill 1–{pageCount}
          </Button>
        )}
      </div>
    </div>
  );
};
