import { useState } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { ToolDefinition } from '@/types';
import { ScanText } from 'lucide-react';

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
  const [enhanceScan, setEnhanceScan] = useState(true);
  const [preserveLayout, setPreserveLayout] = useState(true);

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    isUploading,
  } = useFileUpload({ tool });

  const { job, createJob, cancelJob, retryJob } = useJob();

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const handleProcess = () => {
    if (files.length === 0) return;
    createJob(tool.id, files.map((f) => f.id), { language, enhanceScans: enhanceScan } as const);
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
              />

              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={clearFiles} size="sm">
                  Clear All
                </Button>
              </div>

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
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enhance">Enhance Scan Quality</Label>
                        <p className="text-xs text-muted-foreground">
                          Improve contrast and remove noise
                        </p>
                      </div>
                      <Switch
                        id="enhance"
                        checked={enhanceScan}
                        onCheckedChange={setEnhanceScan}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="layout">Preserve Layout</Label>
                        <p className="text-xs text-muted-foreground">
                          Maintain original document structure
                        </p>
                      </div>
                      <Switch
                        id="layout"
                        checked={preserveLayout}
                        onCheckedChange={setPreserveLayout}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleProcess}
                  disabled={!hasFiles || isProcessing}
                  className="w-full bg-gradient-primary"
                  size="lg"
                >
                  <ScanText className="w-5 h-5 mr-2" />
                  Start OCR Processing
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
