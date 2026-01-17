import { useState } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { ToolDefinition } from '@/types';
import { RotateCw, RotateCcw } from 'lucide-react';

interface RotateToolProps {
  tool: ToolDefinition;
}

type RotationDegree = 90 | 180 | 270;

export const RotateTool = ({ tool }: RotateToolProps) => {
  const [rotation, setRotation] = useState<RotationDegree>(90);
  const [applyTo, setApplyTo] = useState<'all' | 'odd' | 'even'>('all');

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

  const { job, createJob, cancelJob, retryJob } = useJob();

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const handleProcess = () => {
    if (files.length === 0) return;

    const uploadIds = files
      .map((file) => file.serverFileId)
      .filter((id): id is string => Boolean(id));

    if (uploadIds.length !== files.length) return;

    createJob(tool.id, uploadIds, {
      rotation,
      applyToPages: applyTo,
    } as any);
  };

  const handleDownload = () => {
    if (job?.result?.downloadUrl) {
      window.open(job.result.downloadUrl, '_blank');
    }
  };

  const hasFiles = files.length > 0;
  const isProcessing = job?.state === 'processing' || job?.state === 'queued';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!job && (
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
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <RotateCw className="w-5 h-5" />
                  Rotation Settings
                </h3>

                <div className="space-y-4">
                  <Label>Rotation Angle</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setRotation(90)}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-colors ${
                        rotation === 90 ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/50'
                      }`}
                    >
                      <RotateCw className="w-8 h-8 mb-2" />
                      <span className="font-medium">90°</span>
                      <span className="text-xs text-muted-foreground">Clockwise</span>
                    </button>
                    <button
                      onClick={() => setRotation(180)}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-colors ${
                        rotation === 180 ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        <RotateCw className="w-6 h-6" />
                        <RotateCw className="w-6 h-6" />
                      </div>
                      <span className="font-medium">180°</span>
                      <span className="text-xs text-muted-foreground">Upside Down</span>
                    </button>
                    <button
                      onClick={() => setRotation(270)}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-6 cursor-pointer transition-colors ${
                        rotation === 270 ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/50'
                      }`}
                    >
                      <RotateCcw className="w-8 h-8 mb-2" />
                      <span className="font-medium">270°</span>
                      <span className="text-xs text-muted-foreground">Counter-clockwise</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Apply To</Label>
                  <RadioGroup
                    value={applyTo}
                    onValueChange={(v) => setApplyTo(v as 'all' | 'odd' | 'even')}
                    className="grid grid-cols-3 gap-4"
                  >
                    <Label
                      htmlFor="all-pages"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                    >
                      <RadioGroupItem value="all" id="all-pages" className="sr-only" />
                      <span className="font-medium">All Pages</span>
                      <span className="text-xs text-muted-foreground">Rotate every page</span>
                    </Label>
                    <Label
                      htmlFor="odd-pages"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                    >
                      <RadioGroupItem value="odd" id="odd-pages" className="sr-only" />
                      <span className="font-medium">Odd Pages</span>
                      <span className="text-xs text-muted-foreground">1, 3, 5, 7...</span>
                    </Label>
                    <Label
                      htmlFor="even-pages"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                    >
                      <RadioGroupItem value="even" id="even-pages" className="sr-only" />
                      <span className="font-medium">Even Pages</span>
                      <span className="text-xs text-muted-foreground">2, 4, 6, 8...</span>
                    </Label>
                  </RadioGroup>
                </div>

                <Button
                  onClick={handleProcess}
                  disabled={!hasFiles || isProcessing || !canProceed}
                  className="w-full bg-gradient-primary"
                  size="lg"
                >
                  <RotateCw className="w-5 h-5 mr-2" />
                  Rotate Pages
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {job && (
        <JobProgress
          job={job}
          onCancel={cancelJob}
          onRetry={retryJob}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
