import { useState, useRef } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { BatchProgress } from '@/components/common/BatchProgress';
import { BatchModeToggle } from '@/components/common/BatchModeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { useBatchJob } from '@/hooks/useBatchJob';
import { ToolDefinition, ToolOptions } from '@/types';
import { Stamp, Type, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedSwitch } from '@/components/ui/animated';

interface WatermarkToolProps {
  tool: ToolDefinition;
}

type WatermarkPosition = 'center' | 'diagonal' | 'tiled';

export const WatermarkTool = ({ tool }: WatermarkToolProps) => {
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState<WatermarkPosition>('diagonal');
  const [opacity, setOpacity] = useState([50]);
  const [fontSize, setFontSize] = useState([48]);
  const [color, setColor] = useState('#6366f1');
  const [batchMode, setBatchMode] = useState(false);
  const [scale, setScale] = useState([30]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    onComplete: () => toast.success('Watermark added successfully!'),
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
        toast.success(`Watermark added to all ${successful} files!`);
      } else {
        toast.warning(`${successful} files watermarked, ${failed} failed`);
      }
    },
  });

  const handleFilesSelected = (selectedFiles: File[]) => {
    addFiles(selectedFiles);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearWatermarkImage = () => {
    setImageDataUrl(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
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

    const options = {
      type: watermarkType,
      text: watermarkType === 'text' ? text : undefined,
      imageData: watermarkType === 'image' ? imageDataUrl : undefined,
      position,
      opacity: opacity[0],
      fontSize: watermarkType === 'text' ? fontSize[0] : undefined,
      scale: watermarkType === 'image' ? scale[0] : undefined,
      color: watermarkType === 'text' ? color : undefined,
    };

    if (batchMode && files.length > 1) {
      startBatch(tool.id, uploadedFiles, options as ToolOptions);
    } else {
      const uploadIds = uploadedFiles.map((f) => f.serverFileId);
      createJob(tool.id, uploadIds, options as ToolOptions);
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
    clearWatermarkImage();
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
                    <Stamp className="w-5 h-5" />
                    Watermark Settings
                  </h3>

                  <Tabs
                    value={watermarkType}
                    onValueChange={(v) =>
                      setWatermarkType(v as 'text' | 'image')
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="text"
                        className="flex items-center gap-2"
                      >
                        <Type className="w-4 h-4" />
                        Text Watermark
                      </TabsTrigger>
                      <TabsTrigger
                        value="image"
                        className="flex items-center gap-2"
                      >
                        <Image className="w-4 h-4" />
                        Image Watermark
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="text" className="space-y-6 mt-6">
                      <div className="space-y-2">
                        <Label htmlFor="watermark-text">Watermark Text</Label>
                        <Input
                          id="watermark-text"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Enter watermark text..."
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                          <Label>Font Size: {fontSize[0]}px</Label>
                          <div className="flex items-center h-10">
                            <Slider
                              value={fontSize}
                              onValueChange={setFontSize}
                              min={12}
                              max={120}
                              step={4}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="color">Text Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="color"
                              type="color"
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={color}
                              onChange={(e) => setColor(e.target.value)}
                              className="flex-1"
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
                      />
                      {imageDataUrl ? (
                        <div className="space-y-6">
                          <div className="border-2 border-dashed rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <p className="text-sm font-medium">
                                Watermark Image
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearWatermarkImage}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                            <div className="flex justify-center">
                              <img
                                src={imageDataUrl}
                                alt="Watermark preview"
                                className="max-h-40 max-w-full object-contain rounded border bg-muted/30 p-2"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Image Size: {scale[0]}%</Label>
                            <Slider
                              value={scale}
                              onValueChange={setScale}
                              min={10}
                              max={100}
                              step={5}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-8 text-center">
                          <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-2">
                            Upload an image to use as watermark
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            Choose Image
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-4">
                    <Label>Position</Label>
                    <RadioGroup
                      value={position}
                      onValueChange={(v) => setPosition(v as WatermarkPosition)}
                      className="grid grid-cols-3 gap-4"
                    >
                      <Label
                        htmlFor="center"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                      >
                        <RadioGroupItem
                          value="center"
                          id="center"
                          className="sr-only"
                        />
                        <div className="w-12 h-16 border rounded flex items-center justify-center mb-2">
                          <div className="w-6 h-1 bg-primary rounded" />
                        </div>
                        <span className="text-sm font-medium">Center</span>
                      </Label>
                      <Label
                        htmlFor="diagonal"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                      >
                        <RadioGroupItem
                          value="diagonal"
                          id="diagonal"
                          className="sr-only"
                        />
                        <div className="w-12 h-16 border rounded flex items-center justify-center mb-2">
                          <div className="w-10 h-1 bg-primary rounded rotate-[-30deg]" />
                        </div>
                        <span className="text-sm font-medium">Diagonal</span>
                      </Label>
                      <Label
                        htmlFor="tiled"
                        className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                      >
                        <RadioGroupItem
                          value="tiled"
                          id="tiled"
                          className="sr-only"
                        />
                        <div className="w-12 h-16 border rounded grid grid-cols-2 gap-1 p-1 mb-2">
                          <div className="w-full h-1 bg-primary rounded rotate-[-30deg]" />
                          <div className="w-full h-1 bg-primary rounded rotate-[-30deg]" />
                          <div className="w-full h-1 bg-primary rounded rotate-[-30deg]" />
                          <div className="w-full h-1 bg-primary rounded rotate-[-30deg]" />
                        </div>
                        <span className="text-sm font-medium">Tiled</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Opacity: {opacity[0]}%</Label>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      min={10}
                      max={100}
                      step={5}
                    />
                  </div>

                  <Button
                    onClick={handleProcess}
                    disabled={
                      !hasFiles ||
                      isProcessing ||
                      !canProceed ||
                      (watermarkType === 'text' && !text.trim()) ||
                      (watermarkType === 'image' && !imageDataUrl)
                    }
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    <Stamp className="w-5 h-5 mr-2" />
                    {batchMode && files.length > 1
                      ? `Add watermark to ${files.length} files`
                      : 'Add Watermark'}
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
