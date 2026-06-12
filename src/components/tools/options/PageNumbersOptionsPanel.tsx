import { Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';

export const PageNumbersOptionsPanel = ({ form, pageCount }: OptionsPanelProps) => {
  const position = (form.watch('position') as string) ?? 'bc';
  const format = (form.watch('format') as string) ?? '{n}';
  const startNumber = form.watch('startNumber');
  const fontSize = form.watch('fontSize');
  const errors = form.formState.errors;

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-h4 font-semibold">
          <Hash className="h-5 w-5" aria-hidden />
          Page Number Options
        </h3>
        {pageCount !== null && (
          <Text variant="body-sm" tone="muted" as="span">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </Text>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pn-position">Position</Label>
          <Select value={position} onValueChange={(v) => form.setValue('position', v, { shouldValidate: true })}>
            <SelectTrigger id="pn-position">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bc">Bottom Center</SelectItem>
              <SelectItem value="br">Bottom Right</SelectItem>
              <SelectItem value="bl">Bottom Left</SelectItem>
              <SelectItem value="tc">Top Center</SelectItem>
              <SelectItem value="tr">Top Right</SelectItem>
              <SelectItem value="tl">Top Left</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pn-format">Format</Label>
          <Select value={format} onValueChange={(v) => form.setValue('format', v, { shouldValidate: true })}>
            <SelectTrigger id="pn-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="{n}">1, 2, 3...</SelectItem>
              <SelectItem value="Page {n}">Page 1, Page 2...</SelectItem>
              <SelectItem value="Page {n} of {total}">Page 1 of N</SelectItem>
              <SelectItem value="- {n} -">- 1 -, - 2 -...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pn-start-number">Start Number</Label>
          <Input
            id="pn-start-number"
            type="number"
            min={1}
            value={String(startNumber ?? 1)}
            onChange={(e) => form.setValue('startNumber', parseInt(e.target.value) || 1, { shouldValidate: true })}
          />
          {errors.startNumber && (
            <p className="text-caption text-destructive">{String(errors.startNumber.message)}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pn-font-size">Font Size</Label>
          <Input
            id="pn-font-size"
            type="number"
            min={8}
            max={48}
            value={String(fontSize ?? 12)}
            onChange={(e) => form.setValue('fontSize', parseInt(e.target.value) || 12, { shouldValidate: true })}
          />
          {errors.fontSize && (
            <p className="text-caption text-destructive">{String(errors.fontSize.message)}</p>
          )}
        </div>
      </div>
    </div>
  );
};
