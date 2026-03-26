import { useState, useRef, useCallback } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { FileList } from '@/components/common/FileList';
import { JobProgress } from '@/components/common/JobProgress';
import { AnimatedSwitch } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { ToolDefinition, ToolOptions } from '@/types';
import { PenTool, Trash2, Upload } from 'lucide-react';

interface SignPdfToolProps {
  tool: ToolDefinition;
}

export const SignPdfTool = ({ tool }: SignPdfToolProps) => {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [page, setPage] = useState('last');
  const [position, setPosition] = useState('br');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

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

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }, []);

  const endDraw = useCallback(() => {
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL('image/png'));
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const hasSignature = signatureDataUrl !== null;

  const handleProcess = () => {
    if (files.length === 0 || !hasSignature) return;

    const uploadIds = files
      .map((file) => file.serverFileId)
      .filter((id): id is string => Boolean(id));

    if (uploadIds.length !== files.length) return;

    createJob(tool.id, uploadIds, {
      page: page === 'last' ? -1 : parseInt(page) || 1,
      position,
      signatureData: signatureDataUrl,
    });
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
                    <PenTool className="w-5 h-5" />
                    Signature
                  </h3>

                  <Tabs defaultValue="draw">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="draw">Draw Signature</TabsTrigger>
                      <TabsTrigger value="upload">Upload Image</TabsTrigger>
                    </TabsList>

                    <TabsContent value="draw" className="space-y-4">
                      <div className="border rounded-lg bg-white relative">
                        <canvas
                          ref={canvasRef}
                          width={500}
                          height={200}
                          className="w-full cursor-crosshair touch-none"
                          onMouseDown={startDraw}
                          onMouseMove={draw}
                          onMouseUp={endDraw}
                          onMouseLeave={endDraw}
                          onTouchStart={startDraw}
                          onTouchMove={draw}
                          onTouchEnd={endDraw}
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={clearCanvas}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Label htmlFor="signature-upload" className="cursor-pointer">
                          <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                            <Upload className="w-4 h-4" />
                            Choose image
                          </div>
                        </Label>
                        <input
                          id="signature-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                        />
                        {signatureFile && (
                          <span className="text-sm text-muted-foreground">{signatureFile.name}</span>
                        )}
                      </div>
                      {signatureDataUrl && (
                        <div className="border rounded-lg p-4 bg-white">
                          <img src={signatureDataUrl} alt="Signature" className="max-h-32 mx-auto" />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="br">Bottom Right</SelectItem>
                          <SelectItem value="bl">Bottom Left</SelectItem>
                          <SelectItem value="bc">Bottom Center</SelectItem>
                          <SelectItem value="tr">Top Right</SelectItem>
                          <SelectItem value="tl">Top Left</SelectItem>
                          <SelectItem value="tc">Top Center</SelectItem>
                          <SelectItem value="c">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="page">Page</Label>
                      <Input
                        id="page"
                        value={page}
                        onChange={(e) => setPage(e.target.value)}
                        placeholder="Page number or 'last'"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter a page number or &quot;last&quot; for the last page
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleProcess}
                    disabled={!hasFiles || isProcessing || !hasSignature || !canProceed}
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    <PenTool className="w-5 h-5 mr-2" />
                    Sign PDF
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
