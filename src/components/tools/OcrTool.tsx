import { useState } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { BatchProgress } from '@/components/common/BatchProgress';
import { BatchModeToggle } from '@/components/common/BatchModeToggle';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AnimatedSwitch } from '@/components/ui/animated';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { useBatchJob } from '@/hooks/useBatchJob';
import { ToolDefinition } from '@/types';
import { ScanText } from 'lucide-react';
import { toast } from 'sonner';

interface OcrToolProps {
  tool: ToolDefinition;
}

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

export const OcrTool = ({ tool }: OcrToolProps) => {
  const [language, setLanguage] = useState('en');
  const [batchMode, setBatchMode] = useState(false);

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

  const { job, createJob, cancelJob, retryJob, resetJob } = useJob({
    onComplete: () => toast.success('OCR processing complete!'),
  });

  const {
    batchJobs,
    startBatch,
    cancelBatch,
    retryFailed,
    resetBatch,
    isProcessing: isBatchProcessing,
    completedCount,
    failedCount,
    totalCount,
    overallProgress,
  } = useBatchJob({
    onAllComplete: (jobs) => {
      const successful = jobs.filter((j) => j.status === 'completed').length;
      const failed = jobs.filter((j) => j.status === 'failed').length;
      if (failed === 0) {
        toast.success(`All ${successful} files processed with OCR!`);
      } else {
        toast.warning(`${successful} files processed, ${failed} failed`);
      }
    },
  });

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const handleProcess = () => {
    if (files.length === 0) return;

    const uploadedFiles = files
      .filter((f) => f.state === 'completed' && f.serverFileId)
      .map((f) => ({
        id: f.id,
        name: f.file.name,
        serverFileId: f.serverFileId!,
      }));

    if (uploadedFiles.length !== files.length) {
      toast.error('Please wait for all uploads to finish');
      return;
    }

    const options = { language };

    if (batchMode && files.length > 1) {
      startBatch(tool.id, uploadedFiles, options);
    } else {
      const uploadIds = uploadedFiles.map((f) => f.serverFileId);
      createJob(tool.id, uploadIds, options);
    }
  };

  const handleDownload = () => {
    if (job?.result?.downloadUrl) {
      window.open(job.result.downloadUrl, '_blank');
    }
  };

  const handleDownloadAll = () => {
    batchJobs
      .filter((bj) => bj.status === 'completed' && bj.job?.result?.downloadUrl)
      .forEach((bj) => {
        window.open(bj.job?.result?.downloadUrl, '_blank');
      });
  };

  const handleStartOver = () => {
    resetJob();
    resetBatch();
    clearFiles();
    setBatchMode(false);
  };

  const hasFiles = files.length > 0;
  const isProcessing = job?.state === 'processing' || job?.state === 'queued';
  const showBatchProgress = batchMode && batchJobs.length > 0;
  const viewKey = showBatchProgress ? 'batch' : job ? 'progress' : 'upload';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AnimatedSwitch switchKey={viewKey}>
        {showBatchProgress ? (
          <BatchProgress
            batchJobs={batchJobs}
            isProcessing={isBatchProcessing}
            completedCount={completedCount}
            failedCount={failedCount}
            totalCount={totalCount}
            overallProgress={overallProgress}
            onCancel={cancelBatch}
            onRetryFailed={retryFailed}
            onDownloadAll={handleDownloadAll}
            onReset={handleStartOver}
          />
        ) : job ? (
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
              compact={hasFiles}
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

                <BatchModeToggle
                  enabled={batchMode}
                  onToggle={setBatchMode}
                  fileCount={files.length}
                  className="mb-6"
                />

                <div className="rounded-xl border bg-card p-6 space-y-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <ScanText className="w-5 h-5" />
                    OCR Settings
                  </h3>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Document Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language">
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
                        Select the primary language of your document
                      </p>
                    </div>

                    <div className="space-y-4">
                    </div>
                  </div>

                  <Button
                    onClick={handleProcess}
                    disabled={!hasFiles || isProcessing || !canProceed}
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    <ScanText className="w-5 h-5 mr-2" />
                    {batchMode && files.length > 1
                      ? `Process ${files.length} files with OCR`
                      : 'Start OCR Processing'}
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
