import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { ApiKey } from '@/lib/apiKeysApi';
import { revokeApiKey } from '@/lib/apiKeysApi';

interface Props {
  keys: ApiKey[];
  /** Called after a successful revoke so the parent can refresh
   *  its in-memory state without a refetch. The handler should
   *  filter the revoked row out of `keys`. */
  onRevoked: (id: string) => void;
}

/**
 * Compact table view of the caller's API keys. Each row shows the
 * key's display name, environment, prefix, scopes, and timestamps,
 * with a Revoke action gated behind a confirm dialog.
 *
 * Revocation is irreversible at the data plane (the row stays for
 * audit, but the key won't authenticate any longer) — hence the
 * AlertDialog confirm rather than a one-click button.
 */
export function ApiKeysList({ keys, onRevoked }: Props) {
  const [confirmTarget, setConfirmTarget] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // The handler MUST be invoked with the click event so we can
  // preventDefault — radix's AlertDialogAction otherwise closes
  // the dialog synchronously on click, which would dismiss the
  // error banner before the async revoke's catch ever runs.
  // We control the close path explicitly: only on success.
  const handleConfirmRevoke = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!confirmTarget || revoking) return;
    setRevoking(true);
    setErrorMessage('');
    try {
      await revokeApiKey(confirmTarget.id);
      onRevoked(confirmTarget.id);
      setConfirmTarget(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to revoke key.');
    } finally {
      setRevoking(false);
    }
  };

  if (keys.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        You haven't created any API keys yet. Create one to integrate Fyredocs with your code.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Environment</th>
              <th className="px-4 py-2 font-medium">Prefix</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2 font-medium">Last used</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-t" data-testid="api-key-row">
                <td className="px-4 py-2 font-medium">{k.name}</td>
                <td className="px-4 py-2">
                  <Badge variant={k.environment === 'live' ? 'default' : 'secondary'}>
                    {k.environment}
                  </Badge>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{k.keyPrefix}</td>
                <td className="px-4 py-2 text-muted-foreground">{formatDate(k.createdAt)}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {k.lastUsedAt ? formatDate(k.lastUsedAt) : '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmTarget(k)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null);
            setErrorMessage('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this API key?</AlertDialogTitle>
            <AlertDialogDescription>
              Any service still using <code className="font-mono">{confirmTarget?.keyPrefix}</code> will start receiving 401s
              immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRevoke} disabled={revoking}>
              {revoking ? 'Revoking…' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// formatDate renders an ISO timestamp as a locale-friendly date.
// Kept inline rather than centralised because the only other place
// dates render is the editor's revision list, which has its own
// "X minutes ago" formatter.
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
