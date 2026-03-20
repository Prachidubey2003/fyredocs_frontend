import { useState } from 'react';
import { TOOLS } from '@/config/tools';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { ScanToPdfOptions } from '@/types';
import { ToolPageLayout } from './ToolPageLayout';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimatedSwitch, AnimatedCollapse } from '@/components/ui/animated';
import { toast } from 'sonner';
import { Scan, Plus, Trash2 } from 'lucide-react';

const tool = TOOLS['scan-to-pdf'];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
];

export const ScanToPdfTool = () => {
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [language, setLanguage] = useState('en');

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    reorderFiles,
    isUploading,
    canProceed,
    pauseUpload,
    resumeUpload,
    retryUpload: retryFileUpload,
  } = useFileUpload({
    tool,
    onValidationError: (errors) => {
      errors.forEach((error) => toast.error(error));
    },
  });

  const { job, createJob, cancelJob, retryJob, resetJob } = useJob({
    onComplete: () => {
      toast.success('PDF created successfully!');
    },
  });

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const handleCreatePdf = () => {
    if (files.length === 0) {
      toast.error('Please add images to convert');
      return;
    }

    const uploadIds = files
      .map((file) => file.serverFileId)
      .filter((id): id is string => Boolean(id));

    if (uploadIds.length !== files.length) {
      toast.error('Please wait for all uploads to finish');
      return;
    }

    const options: ScanToPdfOptions = {
      ocr: ocrEnabled,
      language: ocrEnabled ? language : undefined,
    };

    createJob(tool.id, uploadIds, options);
  };

  const handleStartOver = () => {
    resetJob();
    clearFiles();
    setOcrEnabled(false);
    setLanguage('en');
  };

  const hasFiles = files.length > 0;
  const isComplete = job?.state === 'completed';
  const viewKey = job ? 'progress' : 'upload';

  return (
    <ToolPageLayout tool={tool}>
      <div className="max-w-3xl mx-auto">
        <AnimatedSwitch switchKey={viewKey}>
          {job ? (
            <div className="space-y-6">
              <JobProgress
                job={job}
                onCancel={cancelJob}
                onRetry={retryJob}
                onDownload={() => {
                  if (job.result?.downloadUrl) {
                    window.open(job.result.downloadUrl, '_blank');
                  }
                }}
              />

              {(isComplete || job.state === 'failed') && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleStartOver}
                >
                  Start over with new images
                </Button>
              )}
            </div>
          ) : (
            <>
              <FileDropzone
                tool={tool}
                onFilesSelected={handleFilesSelected}
                disabled={isUploading}
                compact={hasFiles}
                className="mb-6"
              />

              {hasFiles && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Scan className="w-5 h-5 text-tool-convert" />
                      <span className="font-medium">
                        {files.length} image{files.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFiles}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear all
                    </Button>
                  </div>

                  <FileList
                    files={files}
                    onRemove={removeFile}
                    onRetry={retryFileUpload}
                    onPause={pauseUpload}
                    onResume={resumeUpload}
                    onReorder={reorderFiles}
                    showReorder
                    className="mb-4"
                  />

                  <p className="text-sm text-muted-foreground mb-6 text-center">
                    Drag images to reorder. Pages will follow this order in the PDF.
                  </p>

                  <div className="p-6 rounded-xl border bg-card mb-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Scan className="w-5 h-5 text-tool-convert" />
                      Scan Settings
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="ocr-toggle">Enable OCR</Label>
                          <p className="text-xs text-muted-foreground">
                            Make text in scanned images searchable
                          </p>
                        </div>
                        <Switch
                          id="ocr-toggle"
                          checked={ocrEnabled}
                          onCheckedChange={setOcrEnabled}
                        />
                      </div>

                      <AnimatedCollapse show={ocrEnabled}>
                        <div className="space-y-2">
                          <Label htmlFor="language">Document Language</Label>
                          <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger id="language" className="max-w-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Select the primary language of your documents
                          </p>
                        </div>
                      </AnimatedCollapse>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
                      }
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add more images
                    </Button>
                    <Button
                      className="flex-1 bg-tool-convert hover:bg-tool-convert/90"
                      onClick={handleCreatePdf}
                      disabled={!canProceed}
                    >
                      <Scan className="w-4 h-4 mr-2" />
                      Create PDF
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </AnimatedSwitch>
      </div>
    </ToolPageLayout>
  );
};
