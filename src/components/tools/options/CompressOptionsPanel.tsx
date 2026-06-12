import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { OptionsPanelProps } from './types';

type CompressionLevel = 'low' | 'medium' | 'high' | 'extreme';

const COMPRESSION_LEVELS: Array<{
  value: CompressionLevel;
  label: string;
  description: string;
  reduction: string;
}> = [
  { value: 'low', label: 'Low', description: 'Minimal compression, highest quality', reduction: '~10-20%' },
  { value: 'medium', label: 'Medium', description: 'Balanced compression and quality', reduction: '~30-50%' },
  { value: 'high', label: 'High', description: 'Strong compression, good quality', reduction: '~50-70%' },
  { value: 'extreme', label: 'Extreme', description: 'Maximum compression, reduced quality', reduction: '~70-90%' },
];

export const CompressOptionsPanel = ({ form }: OptionsPanelProps) => {
  const quality = (form.watch('quality') as CompressionLevel) ?? 'medium';

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 font-semibold">Compression Level</h3>

      <RadioGroup
        value={quality}
        onValueChange={(value) => form.setValue('quality', value as CompressionLevel, { shouldValidate: true })}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {COMPRESSION_LEVELS.map((level) => (
          <div key={level.value}>
            <RadioGroupItem value={level.value} id={`compress-${level.value}`} className="peer sr-only" />
            <Label
              htmlFor={`compress-${level.value}`}
              className={cn(
                'flex cursor-pointer flex-col items-center rounded-lg border-2 p-4 transition-colors',
                'hover:border-primary/50',
                'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
              )}
            >
              <span className="mb-1 font-medium">{level.label}</span>
              <span className="text-center text-caption text-muted-foreground">{level.reduction}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      <Text variant="body-sm" tone="muted" className="mt-4 text-center">
        {COMPRESSION_LEVELS.find((l) => l.value === quality)?.description}
      </Text>
    </div>
  );
};
