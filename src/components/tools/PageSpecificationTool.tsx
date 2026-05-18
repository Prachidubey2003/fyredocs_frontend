import { useState } from 'react';
import { TOOLS } from '@/config/tools';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { usePdfPageCount } from '@/hooks/usePdfPageCount';
import { RemovePagesOptions, ExtractPagesOptions, ToolId } from '@/types';
import { ToolPageLayout } from './ToolPageLayout';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FileMinus, FileOutput } from 'lucide-react';
import { AnimatedSwitch } from '@/components/ui/animated';

interface PageSpecificationToolProps {
  toolId: 'remove-pages' | 'extract-pages';
  actionLabel: string;
  actionVerb: string;
  description: string;
}

const ICONS = {
  'remove-pages': FileMinus,
  'extract-pages': FileOutput,
} as const;

export const PageSpecificationTool = ({
  toolId,
  actionLabel,
  actionVerb,
  description,
}: PageSpecificationToolProps) => {
  const tool = TOOLS[toolId];
  const Icon = ICONS[toolId];
  const [pagesInput, setPagesInput] = useState('');

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
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
      toast.success(`${actionLabel} completed successfully!`);
    },
  });

  const { pageCount, readPageCount, reset: resetPageCount } = usePdfPageCount();

  const handleFilesSelected = async (selectedFiles: File[]) => {
    addFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      await readPageCount(selectedFiles[0]);
    }
  };

  const handleProcess = () => {
    if (files.length === 0) {
      toast.error('Please add a PDF file');
      return;
    }

    if (!pagesInput.trim()) {
      toast.error('Please enter page numbers');
      return;
    }

    const uploadIds = files
      .map((file) => file.serverFileId)
      .filter((id): id is string => Boolean(id));

    if (uploadIds.length !== files.length) {
      toast.error('Please wait for the upload to finish');
      return;
    }

    const options: RemovePagesOptions | ExtractPagesOptions = {
      pages: pagesInput.trim(),
    };

    createJob(tool.id, uploadIds, options);
  };

  const handleStartOver = () => {
    resetJob();
    clearFiles();
    setPagesInput('');
    resetPageCount();
  };

  const hasFile = files.length > 0;
  const viewKey = job ? 'progress' : 'upload';

  return (
    <ToolPageLayout tool={tool}>
      <div className="max-w-3xl mx-auto">
        <AnimatedSwitch switchKey={viewKey}>
          {job ? (
            <JobProgress
              job={job}
              onCancel={cancelJob}
              onRetry={retryJob}
              onDownload={() => {
                if (job.result?.downloadUrl) {
                  window.open(job.result.downloadUrl, '_blank');
                }
              }}
              onReset={handleStartOver}
            />
          ) : (
            <>
              {!hasFile ? (
                <FileDropzone
                  tool={tool}
                  onFilesSelected={handleFilesSelected}
                  className="mb-6"
                />
              ) : (
                <>
                  <div className="mb-8">
                    <FileList
                      files={files}
                      onRemove={removeFile}
                      onRetry={retryFileUpload}
                      onPause={pauseUpload}
                      onResume={resumeUpload}
                    />
                  </div>

                  <div className="p-6 rounded-xl border bg-card mb-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Icon className="w-5 h-5 text-tool-organize" />
                      {actionLabel}
                    </h3>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                      <Input
                        placeholder="e.g., 2,4,6-8"
                        value={pagesInput}
                        onChange={(e) => setPagesInput(e.target.value)}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter page numbers and/or ranges separated by commas
                        {pageCount !== null &&
                          ` (your PDF has ${pageCount} pages)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={clearFiles}
                    >
                      Choose different file
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                      onClick={handleProcess}
                      disabled={!canProceed || !pagesInput.trim()}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {actionVerb} Pages
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
