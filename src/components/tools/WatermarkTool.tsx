import { useState } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { ToolDefinition } from '@/types';
import { Stamp, Type, Image } from 'lucide-react';

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
      type: watermarkType,
      text: watermarkType === 'text' ? text : undefined,
      position,
      opacity: opacity[0],
      fontSize: fontSize[0],
      color,
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
                  <Stamp className="w-5 h-5" />
                  Watermark Settings
                </h3>

                <Tabs value={watermarkType} onValueChange={(v) => setWatermarkType(v as 'text' | 'image')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Text Watermark
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-2">
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

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Font Size: {fontSize[0]}px</Label>
                        <Slider
                          value={fontSize}
                          onValueChange={setFontSize}
                          min={12}
                          max={120}
                          step={4}
                        />
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
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Upload an image to use as watermark
                      </p>
                      <Button variant="outline">Choose Image</Button>
                    </div>
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
                      <RadioGroupItem value="center" id="center" className="sr-only" />
                      <div className="w-12 h-16 border rounded flex items-center justify-center mb-2">
                        <div className="w-6 h-1 bg-primary rounded" />
                      </div>
                      <span className="text-sm font-medium">Center</span>
                    </Label>
                    <Label
                      htmlFor="diagonal"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                    >
                      <RadioGroupItem value="diagonal" id="diagonal" className="sr-only" />
                      <div className="w-12 h-16 border rounded flex items-center justify-center mb-2">
                        <div className="w-10 h-1 bg-primary rounded rotate-[-30deg]" />
                      </div>
                      <span className="text-sm font-medium">Diagonal</span>
                    </Label>
                    <Label
                      htmlFor="tiled"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-muted p-4 cursor-pointer hover:bg-muted/50 has-[[data-state=checked]]:border-primary"
                    >
                      <RadioGroupItem value="tiled" id="tiled" className="sr-only" />
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
                  disabled={!hasFiles || isProcessing || !canProceed || (watermarkType === 'text' && !text.trim())}
                  className="w-full bg-gradient-primary"
                  size="lg"
                >
                  <Stamp className="w-5 h-5 mr-2" />
                  Add Watermark
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
