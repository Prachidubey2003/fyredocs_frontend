import { ArrowRight, FileType } from 'lucide-react';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';

/** Display-only strip for convert tools — the output format is fixed per tool. */
export const ConvertInfoPanel = ({ tool }: OptionsPanelProps) => {
  if (!tool.outputFormat) return null;

  return (
    <div className="rounded-lg border border-category-convert-to/20 bg-category-convert-to-subtle p-4">
      <div className="flex items-center justify-center gap-2">
        <FileType className="h-4 w-4 text-category-convert-to" aria-hidden />
        <Text variant="body-sm" as="span">
          Converting to
        </Text>
        <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        <Text variant="body-sm" as="span" className="font-semibold text-category-convert-to">
          .{tool.outputFormat.toUpperCase()}
        </Text>
      </div>
    </div>
  );
};
