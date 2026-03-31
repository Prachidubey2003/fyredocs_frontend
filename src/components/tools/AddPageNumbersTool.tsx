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
import { Hash } from 'lucide-react';

interface AddPageNumbersToolProps {
  tool: ToolDefinition;
}

export const AddPageNumbersTool = ({ tool }: AddPageNumbersToolProps) => {
  const [position, setPosition] = useState('bc');
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [format, setFormat] = useState('{n}');

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
    setPosition('bc');
    setStartNumber(1);
    setFontSize(12);
    setFormat('{n}');
  };

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
      position,
      startNumber,
      fontSize,
      format,
    } as ToolOptions);
  };

  const handleDownload = () => {
    if (job?.result?.downloadUrl) {
      window.open(job.result.downloadUrl, '_blank');
    }
  };

  const hasFiles = files.length > 0;
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
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Page Number Options
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bc">Bottom Center</SelectItem>
                          <SelectItem value="br">Bottom Right</SelectItem>
                          <SelectItem value="bl">Bottom Left</SelectItem>
                          <SelectItem value="tc">Top Center</SelectItem>
                          <SelectItem value="tr">Top Right</SelectItem>
                          <SelectItem value="tl">Top Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="format">Format</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="{n}">1, 2, 3...</SelectItem>
                          <SelectItem value="Page {n}">Page 1, Page 2...</SelectItem>
                          <SelectItem value="Page {n} of {total}">Page 1 of N</SelectItem>
                          <SelectItem value="- {n} -">- 1 -, - 2 -...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startNumber">Start Number</Label>
                      <Input
                        id="startNumber"
                        type="number"
                        min={1}
                        value={startNumber}
                        onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Input
                        id="fontSize"
                        type="number"
                        min={8}
                        max={48}
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleProcess}
                    disabled={!hasFiles || isProcessing || !canProceed}
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    <Hash className="w-5 h-5 mr-2" />
                    Add Page Numbers
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
