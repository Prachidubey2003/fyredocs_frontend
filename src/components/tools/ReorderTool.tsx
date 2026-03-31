import { useState } from 'react';
import { FileDropzone } from '@/components/common/FileDropzone';
import { JobProgress } from '@/components/common/JobProgress';
import { AnimatedSwitch } from '@/components/ui/animated';
import { Button } from '@/components/ui/button';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useJob } from '@/hooks/useJob';
import { usePdfPageCount } from '@/hooks/usePdfPageCount';
import { ToolDefinition, ToolOptions } from '@/types';
import { ArrowUpDown, GripVertical, FileText, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReorderToolProps {
  tool: ToolDefinition;
}

interface PageItem {
  id: number;
  label: string;
}

export const ReorderTool = ({ tool }: ReorderToolProps) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const [dragOverPage, setDragOverPage] = useState<number | null>(null);

  const {
    files,
    addFiles,
    clearFiles,
    isUploading,
    canProceed,
  } = useFileUpload({ tool });

  const { job, createJob, cancelJob, retryJob, resetJob } = useJob();
  const { readPageCount, reset: resetPageCount } = usePdfPageCount();

  const handleFilesSelected = async (selectedFiles: File[]) => {
    addFiles(selectedFiles);
    if (selectedFiles.length > 0) {
      const count = await readPageCount(selectedFiles[0]);
      if (count !== null) {
        setPages(
          Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            label: `Page ${i + 1}`,
          }))
        );
      } else {
        toast.error('Could not read PDF pages');
        setPages([]);
      }
    }
  };

  const handleDragStart = (pageId: number) => {
    setDraggedPage(pageId);
  };

  const handleDragOver = (e: React.DragEvent, pageId: number) => {
    e.preventDefault();
    if (draggedPage !== pageId) {
      setDragOverPage(pageId);
    }
  };

  const handleDragLeave = () => {
    setDragOverPage(null);
  };

  const handleDrop = (targetPageId: number) => {
    if (draggedPage === null || draggedPage === targetPageId) {
      setDraggedPage(null);
      setDragOverPage(null);
      return;
    }

    setPages((prevPages) => {
      const newPages = [...prevPages];
      const draggedIndex = newPages.findIndex((p) => p.id === draggedPage);
      const targetIndex = newPages.findIndex((p) => p.id === targetPageId);
      const [removed] = newPages.splice(draggedIndex, 1);
      newPages.splice(targetIndex, 0, removed);
      return newPages;
    });

    setDraggedPage(null);
    setDragOverPage(null);
  };

  const handleRemovePage = (pageId: number) => {
    setPages((prevPages) => prevPages.filter((p) => p.id !== pageId));
  };

  const handleProcess = () => {
    if (files.length === 0 || pages.length === 0) return;

    const uploadIds = files
      .map((file) => file.serverFileId)
      .filter((id): id is string => Boolean(id));

    if (uploadIds.length !== files.length) return;

    createJob(tool.id, uploadIds, {
      order: pages.map((p) => p.id).join(','),
    } as ToolOptions);
  };

  const handleStartOver = () => {
    resetJob();
    clearFiles();
    setPages([]);
    resetPageCount();
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

            {hasFiles && pages.length > 0 && (
              <div className="rounded-xl border bg-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <ArrowUpDown className="w-5 h-5" />
                    Reorder Pages
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearFiles();
                        setPages([]);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Drag and drop pages to reorder them. Remove pages you don't want to include.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pages.map((page) => (
                    <div
                      key={page.id}
                      draggable
                      onDragStart={() => handleDragStart(page.id)}
                      onDragOver={(e) => handleDragOver(e, page.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={() => handleDrop(page.id)}
                      className={cn(
                        'relative group rounded-lg border-2 bg-muted/30 p-4 cursor-grab active:cursor-grabbing transition-all',
                        draggedPage === page.id && 'opacity-50 scale-95',
                        dragOverPage === page.id && 'border-primary border-dashed',
                        'hover:border-primary/50'
                      )}
                    >
                      <div className="aspect-[3/4] rounded border bg-background flex items-center justify-center mb-3">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{page.label}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePage(page.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    New page order: {pages.map((p) => p.id).join(', ')}
                  </p>
                  <Button
                    onClick={handleProcess}
                    disabled={!hasFiles || isProcessing || pages.length === 0 || !canProceed}
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    <ArrowUpDown className="w-5 h-5 mr-2" />
                    Apply New Order
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </AnimatedSwitch>
    </div>
  );
};
