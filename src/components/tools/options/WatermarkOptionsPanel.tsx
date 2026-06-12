import { useRef } from 'react';
import { Stamp, Type, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import { OptionsPanelProps } from './types';

type WatermarkType = 'text' | 'image';
type WatermarkPosition = 'center' | 'diagonal' | 'tiled';

export const WatermarkOptionsPanel = ({ form }: OptionsPanelProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const type = (form.watch('type') as WatermarkType) ?? 'text';
  const text = (form.watch('text') as string) ?? '';
  const position = (form.watch('position') as WatermarkPosition) ?? 'diagonal';
  const opacity = Number(form.watch('opacity') ?? 50);
  const fontSize = Number(form.watch('fontSize') ?? 48);
  const scale = Number(form.watch('scale') ?? 30);
  const color = (form.watch('color') as string) ?? '#6366f1';
  const imageData = (form.watch('imageData') as string) || '';
  const errors = form.formState.errors;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      form.setValue('imageData', reader.result as string, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const clearWatermarkImage = () => {
    form.setValue('imageData', '', { shouldValidate: true });
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <h3 className="flex items-center gap-2 text-h4 font-semibold">
        <Stamp className="h-5 w-5" aria-hidden />
        Watermark Settings
      </h3>

      <Tabs value={type} onValueChange={(v) => form.setValue('type', v as WatermarkType, { shouldValidate: true })}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="h-4 w-4" aria-hidden />
            Text Watermark
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" aria-hidden />
            Image Watermark
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark Text</Label>
            <Input
              id="watermark-text"
              value={text}
              onChange={(e) => form.setValue('text', e.target.value, { shouldValidate: true })}
              placeholder="Enter watermark text..."
            />
            {errors.text && (
              <p className="text-caption text-destructive">{String(errors.text.message)}</p>
            )}
          </div>

          <div className="grid items-end gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Font Size: {fontSize}px</Label>
              <div className="flex h-10 items-center">
                <Slider
                  value={[fontSize]}
                  onValueChange={([v]) => form.setValue('fontSize', v, { shouldValidate: true })}
                  min={12}
                  max={120}
                  step={4}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="watermark-color">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="watermark-color"
                  type="color"
                  value={color}
                  onChange={(e) => form.setValue('color', e.target.value, { shouldValidate: true })}
                  className="h-10 w-12 cursor-pointer p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => form.setValue('color', e.target.value, { shouldValidate: true })}
                  className="flex-1"
                  aria-label="Text color hex value"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleImageSelect}
            aria-label="Watermark image file"
          />
          {imageData ? (
            <div className="space-y-6">
              <div className="rounded-lg border-2 border-dashed p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Text variant="body-sm" as="span" className="font-medium">
                    Watermark Image
                  </Text>
                  <Button variant="ghost" size="sm" onClick={clearWatermarkImage}>
                    <X className="mr-1 h-4 w-4" aria-hidden />
                    Remove
                  </Button>
                </div>
                <div className="flex justify-center">
                  <img
                    src={imageData}
                    alt="Watermark preview"
                    className="max-h-40 max-w-full rounded border bg-muted/30 object-contain p-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image Size: {scale}%</Label>
                <Slider
                  value={[scale]}
                  onValueChange={([v]) => form.setValue('scale', v, { shouldValidate: true })}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <Image className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
              <Text tone="muted" className="mb-2">
                Upload an image to use as watermark
              </Text>
              <Button variant="outline" onClick={() => imageInputRef.current?.click()}>
                Choose Image
              </Button>
              {errors.imageData && (
                <p className="mt-2 text-caption text-destructive">{String(errors.imageData.message)}</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <Label>Position</Label>
        <RadioGroup
          value={position}
          onValueChange={(v) => form.setValue('position', v as WatermarkPosition, { shouldValidate: true })}
          className="grid grid-cols-3 gap-4"
        >
          <Label
            htmlFor="wm-center"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroupItem value="center" id="wm-center" className="sr-only" />
            <div className="mb-2 flex h-16 w-12 items-center justify-center rounded border">
              <div className="h-1 w-6 rounded bg-primary" />
            </div>
            <span className="text-body-sm font-medium">Center</span>
          </Label>
          <Label
            htmlFor="wm-diagonal"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroupItem value="diagonal" id="wm-diagonal" className="sr-only" />
            <div className="mb-2 flex h-16 w-12 items-center justify-center rounded border">
              <div className="h-1 w-10 rotate-[-30deg] rounded bg-primary" />
            </div>
            <span className="text-body-sm font-medium">Diagonal</span>
          </Label>
          <Label
            htmlFor="wm-tiled"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted p-4 hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
          >
            <RadioGroupItem value="tiled" id="wm-tiled" className="sr-only" />
            <div className="mb-2 grid h-16 w-12 grid-cols-2 gap-1 rounded border p-1">
              <div className="h-1 w-full rotate-[-30deg] rounded bg-primary" />
              <div className="h-1 w-full rotate-[-30deg] rounded bg-primary" />
              <div className="h-1 w-full rotate-[-30deg] rounded bg-primary" />
              <div className="h-1 w-full rotate-[-30deg] rounded bg-primary" />
            </div>
            <span className="text-body-sm font-medium">Tiled</span>
          </Label>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Opacity: {opacity}%</Label>
        <Slider
          value={[opacity]}
          onValueChange={([v]) => form.setValue('opacity', v, { shouldValidate: true })}
          min={10}
          max={100}
          step={5}
        />
      </div>
    </div>
  );
};
