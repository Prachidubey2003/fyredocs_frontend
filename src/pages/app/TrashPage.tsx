import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { TableSkeleton } from '@/components/common/LoadingState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FileTypeIcon } from '@/components/app/FileTypeIcon';
import { useDocuments, useRestoreDocument, usePurgeDocument } from '@/hooks/useDocuments';
import { formatBytes } from '@/lib/userMetrics';
import { toast } from '@/lib/toast';
import type { ApiDocument } from '@/lib/documentsApi';

const TrashPage = () => {
  const { data, isLoading, isError, refetch } = useDocuments({ trashed: true, limit: 100 });
  const restore = useRestoreDocument();
  const purge = usePurgeDocument();
  const [toPurge, setToPurge] = useState<ApiDocument | null>(null);

  const documents = data?.documents ?? [];

  const handleRestore = async (doc: ApiDocument) => {
    try {
      await restore.mutateAsync(doc.id);
      toast.success('Document restored');
    } catch {
      toast.error('Could not restore document');
    }
  };

  const handlePurge = async (doc: ApiDocument) => {
    try {
      await purge.mutateAsync(doc.id);
      toast.success('Document permanently deleted');
    } catch {
      toast.error('Could not delete document');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Helmet>
        <title>Trash — Fyredocs</title>
      </Helmet>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          Deleted documents are kept here until you restore or permanently remove them.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <MetricsErrorState title="Could not load Trash" onRetry={() => refetch()} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Documents you delete from your library will appear here."
          action={
            <Button asChild variant="outline">
              <Link to="/app/documents">Back to Documents</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileTypeIcon fileType={doc.fileType} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.name}</p>
                <p className="truncate text-caption text-muted-foreground">
                  {[doc.fileType?.toUpperCase(), formatBytes(doc.fileSize), `deleted ${format(new Date(doc.updatedAt), 'd MMM')}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleRestore(doc)} disabled={restore.isPending}>
                <RotateCcw className="h-4 w-4" aria-hidden />
                Restore
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                aria-label={`Permanently delete ${doc.name}`}
                onClick={() => setToPurge(doc)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={toPurge != null}
        onOpenChange={(open) => { if (!open) setToPurge(null); }}
        title="Permanently delete?"
        description={`${toPurge?.name ?? 'This document'} will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete forever"
        tone="destructive"
        onConfirm={() => {
          if (toPurge) void handlePurge(toPurge);
          setToPurge(null);
        }}
      />
    </div>
  );
};

export default TrashPage;
