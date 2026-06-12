import { useState } from 'react';
import { Edit, Plus, Trash2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { ToolOptions } from '@/types';
import { BespokeConfigureProps } from './types';

interface Annotation {
  id: string;
  type: 'text';
  content: string;
  page: number;
  position: string;
  fontSize: number;
}

/**
 * Bespoke configure body for Edit PDF: text annotation list.
 * Lazily imported by the workbench.
 */
const EditPdfConfigure = ({ canSubmit, onSubmit }: BespokeConfigureProps) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const addAnnotation = () => {
    setAnnotations([
      ...annotations,
      {
        id: `ann-${Date.now()}`,
        type: 'text',
        content: '',
        page: 1,
        position: 'bc',
        fontSize: 12,
      },
    ]);
  };

  const updateAnnotation = (id: string, field: keyof Annotation, value: string | number) => {
    setAnnotations(annotations.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(annotations.filter((a) => a.id !== id));
  };

  const hasAnnotations =
    annotations.length > 0 && annotations.every((a) => a.content.trim() !== '');

  const handleProcess = () => {
    if (annotations.length === 0) return;
    onSubmit({
      annotations: annotations.map(({ content, page, position, fontSize }) => ({
        type: 'text' as const,
        content,
        page,
        position,
        fontSize,
      })),
    } as ToolOptions);
  };

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-h4 font-semibold">
          <Edit className="h-5 w-5" aria-hidden />
          Text Annotations
        </h3>
        <Button variant="outline" size="sm" onClick={addAnnotation}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Add Text
        </Button>
      </div>

      {annotations.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <Type className="mx-auto mb-3 h-12 w-12 opacity-50" aria-hidden />
          <Text tone="muted">No annotations added yet.</Text>
          <Text variant="body-sm" tone="muted">
            Click &quot;Add Text&quot; to add text annotations to your PDF.
          </Text>
        </div>
      )}

      {annotations.map((ann) => (
        <div key={ann.id} className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium">Text Annotation</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeAnnotation(ann.id)}
              className="text-destructive hover:text-destructive"
              aria-label="Remove annotation"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Text Content</Label>
            <Input
              value={ann.content}
              onChange={(e) => updateAnnotation(ann.id, 'content', e.target.value)}
              placeholder="Enter text to add..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Page</Label>
              <Input
                type="number"
                min={1}
                value={ann.page}
                onChange={(e) => updateAnnotation(ann.id, 'page', parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={ann.position}
                onValueChange={(v) => updateAnnotation(ann.id, 'position', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tl">Top Left</SelectItem>
                  <SelectItem value="tc">Top Center</SelectItem>
                  <SelectItem value="tr">Top Right</SelectItem>
                  <SelectItem value="c">Center</SelectItem>
                  <SelectItem value="bl">Bottom Left</SelectItem>
                  <SelectItem value="bc">Bottom Center</SelectItem>
                  <SelectItem value="br">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="number"
                min={8}
                max={72}
                value={ann.fontSize}
                onChange={(e) => updateAnnotation(ann.id, 'fontSize', parseInt(e.target.value) || 12)}
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        onClick={handleProcess}
        disabled={!hasAnnotations || !canSubmit}
        variant="gradient"
        className="w-full"
        size="lg"
      >
        <Edit className="mr-2 h-5 w-5" aria-hidden />
        Apply Annotations
      </Button>
    </div>
  );
};

export default EditPdfConfigure;
