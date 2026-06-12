import { FileMinus, FileOutput } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';

const COPY = {
  'remove-pages': {
    icon: FileMinus,
    title: 'Remove Pages',
    description: 'Enter the pages you want to remove from the document.',
  },
  'extract-pages': {
    icon: FileOutput,
    title: 'Extract Pages',
    description: 'Enter the pages you want to extract into a new PDF.',
  },
} as const;

/** Shared panel for remove-pages / extract-pages — verb derives from tool.id. */
export const PageSelectionPanel = ({ tool, form, pageCount }: OptionsPanelProps) => {
  const copy = COPY[tool.id as keyof typeof COPY] ?? COPY['extract-pages'];
  const Icon = copy.icon;
  const pages = (form.watch('pages') as string) ?? '';
  const error = form.formState.errors.pages;

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <Icon className="h-5 w-5 text-category-organize" aria-hidden />
        {copy.title}
      </h3>

      <div className="space-y-2">
        <Label htmlFor="pages-input" className="sr-only">
          Pages
        </Label>
        <Text variant="body-sm" tone="muted">
          {copy.description}
        </Text>
        <Input
          id="pages-input"
          placeholder="e.g., 2,4,6-8"
          value={pages}
          onChange={(e) => form.setValue('pages', e.target.value, { shouldValidate: true })}
          className="max-w-xs"
        />
        {error && <p className="text-caption text-destructive">{String(error.message)}</p>}
        <Text variant="caption" tone="muted">
          Enter page numbers and/or ranges separated by commas
          {pageCount !== null && ` (your PDF has ${pageCount} pages)`}
        </Text>
      </div>
    </div>
  );
};
