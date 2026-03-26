import { useState } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { AnimatedSwitch } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { ToolDefinition, ToolOptions } from '@/types';
import { Edit, Plus, Trash2, Type } from 'lucide-react';

interface Annotation {
  id: string;
  type: 'text';
  content: string;
  page: number;
  position: string;
  fontSize: number;
}

interface EditPdfToolProps {
  tool: ToolDefinition;
}

export const EditPdfTool = ({ tool }: EditPdfToolProps) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    isUploading,
    canProceed,
    pauseUpload,
    resumeUpload,
    retryUpload: retryFileUpload,
  } = useFileUpload({ tool });

  const { job, createJob, cancelJob, retryJob, resetJob } = useJob();

  const handleStartOver = () => {
    resetJob();
    clearFiles();
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

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

  const handleProcess = () => {
    if (files.length === 0 || annotations.length === 0) return;

    const uploadIds = files
      .map((file) => file.serverFileId)
      .filter((id): id is string => Boolean(id));

    if (uploadIds.length !== files.length) return;

    createJob(tool.id, uploadIds, {
      annotations: annotations.map(({ content, page, position, fontSize }) => ({
        type: 'text' as const,
        content,
        page,
        position,
        fontSize,
      })),
    });
  };

  const handleDownload = () => {
    if (job?.result?.downloadUrl) {
      window.open(job.result.downloadUrl, '_blank');
    }
  };

  const hasFiles = files.length > 0;
  const hasAnnotations = annotations.length > 0 && annotations.every((a) => a.content.trim() !== '');
  const isProcessing = job?.state === 'processing' || job?.state === 'queued';
  const viewKey = job ? 'progress' : 'upload';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AnimatedSwitch switchKey={viewKey}>
        {job ? (
          <JobProgress
            job={job}
            onCancel={cancelJob}
            onRetry={retryJob}
            onDownload={handleDownload}
            onReset={handleStartOver}
          />
        ) : (
          <>
            <FileDropzone
              tool={tool}
              onFilesSelected={handleFilesSelected}
              disabled={isUploading}
            />

            {hasFiles && (
              <>
                <FileList
                  files={files}
                  onRemove={removeFile}
                  onRetry={retryFileUpload}
                  onPause={pauseUpload}
                  onResume={resumeUpload}
                />

                <div className="flex justify-end mb-4">
                  <Button variant="outline" onClick={clearFiles} size="sm">
                    Clear All
                  </Button>
                </div>

                <div className="rounded-xl border bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      Text Annotations
                    </h3>
                    <Button variant="outline" size="sm" onClick={addAnnotation}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Text
                    </Button>
                  </div>

                  {annotations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Type className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No annotations added yet.</p>
                      <p className="text-sm">Click &quot;Add Text&quot; to add text annotations to your PDF.</p>
                    </div>
                  )}

                  {annotations.map((ann) => (
                    <div key={ann.id} className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Text Annotation</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAnnotation(ann.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
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
                    disabled={!hasFiles || isProcessing || !hasAnnotations || !canProceed}
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    <Edit className="w-5 h-5 mr-2" />
                    Apply Annotations
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </AnimatedSwitch>
    </div>
  );
};
