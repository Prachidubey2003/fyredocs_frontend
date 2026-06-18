import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { Download, FileJson, FileSpreadsheet, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { useExports, useCreateExport } from '@/hooks/useExports';
import { exportDownloadUrl, type ExportFormat, type ExportStatus } from '@/lib/exportsApi';
import { useActiveOrg } from '@/components/app/ActiveOrgContext';
import { toast } from '@/lib/toast';

const STATUS_TONE: Record<ExportStatus, string> = {
  queued: 'bg-muted text-muted-foreground',
  processing: 'bg-accent text-accent-foreground',
  ready: 'bg-success-subtle text-success-subtle-foreground',
  failed: 'bg-destructive-subtle text-destructive-subtle-foreground',
};

const ExportsPage = () => {
  const { activeOrgId, activeOrg } = useActiveOrg();
  const scopeLabel = activeOrgId ? (activeOrg?.name ?? 'this workspace') : 'your personal library';
  const { data: exports = [], isLoading } = useExports();
  const create = useCreateExport();
  const [dialog, setDialog] = useState(false);
  const [fmt, setFmt] = useState<ExportFormat>('csv');

  const handleCreate = async () => {
    try {
      await create.mutateAsync({ format: fmt, organizationId: activeOrgId ?? undefined });
      toast.success('Export queued');
      setDialog(false);
    } catch {
      toast.error('Could not start export');
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Helmet><title>Exports — Fyredocs</title></Helmet>
      <AdminPageHeader
        title="Exports"
        description={`Generate downloadable exports of ${scopeLabel}.`}
        actions={
          <Button size="sm" onClick={() => setDialog(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New export
          </Button>
        }
      />

      <Card>
        <CardHeader className="p-4 pb-2">
          <h3 className="text-sm font-medium">Recent exports</h3>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : exports.length === 0 ? (
            <EmptyState
              size="sm"
              icon={Download}
              title="No exports yet"
              description="Create an export to download your document list as CSV or JSON."
            />
          ) : (
            <ul className="divide-y">
              {exports.map((e) => {
                const pending = e.status === 'queued' || e.status === 'processing';
                return (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {e.format === 'json' ? (
                        <FileJson className="h-4 w-4 text-info" aria-hidden />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 text-success" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {e.fileName ?? `${e.format.toUpperCase()} export`}
                      </p>
                      <p className="truncate text-caption text-muted-foreground">
                        {e.documentCount} document{e.documentCount === 1 ? '' : 's'} · {format(new Date(e.createdAt), 'd MMM, p')}
                        {e.status === 'failed' && e.error ? ` · ${e.error}` : ''}
                      </p>
                    </div>
                    <Badge className={`capitalize ${STATUS_TONE[e.status]}`}>
                      {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden />}
                      {e.status}
                    </Badge>
                    {e.status === 'ready' ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={exportDownloadUrl(e.id)} download>
                          <Download className="h-4 w-4" aria-hidden />
                          Download
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <Download className="h-4 w-4" aria-hidden />
                        Download
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New export</DialogTitle>
            <DialogDescription>Export all documents in {scopeLabel}.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-1.5">
            <label className="text-sm font-medium">Format</label>
            <Select value={fmt} onValueChange={(v) => setFmt(v as ExportFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (spreadsheet)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-5">
            <Button type="button" variant="ghost" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={create.isPending}>Create export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExportsPage;
