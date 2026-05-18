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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  type CreateWebhookResponse,
  type WebhookDelivery,
  type WebhookSubscription,
  deleteWebhook,
  enableWebhook,
  rotateWebhookSecret,
  testWebhook,
} from '@/lib/webhooksApi';

interface Props {
  subs: WebhookSubscription[];
  /** Called after a successful delete so the parent can drop the
   *  row from its in-memory state without a refetch. */
  onDeleted: (id: string) => void;
  /** Called after a successful enable so the parent can update
   *  the row's status + reset its failure_count in place. */
  onEnabled: (sub: WebhookSubscription) => void;
  /** Called after a test-fire so the parent can prepend the
   *  resulting Delivery to its in-memory history without a
   *  refetch. */
  onTested?: (delivery: WebhookDelivery) => void;
  /** Called after a successful secret rotation so the parent
   *  can update the row's `secretPrefix` in place. */
  onRotated?: (sub: WebhookSubscription) => void;
}

/**
 * Table view of the caller's webhook subscriptions. Each row
 * shows event type + target URL + status badge + a contextual
 * action:
 *
 *   - active row → Delete (with confirm).
 *   - disabled row → Enable + Delete.
 *
 * The Delete confirm is required because the row is soft-deleted
 * (preserves audit attribution) but the user perceives it as
 * irreversible — the same subscription can't be resurrected
 * through /enable after a delete.
 *
 * Enable is one-click: it's idempotent on the server and the
 * worst case is "you reset a counter on an already-healthy row",
 * which the user could have done preemptively anyway.
 */
export function WebhookSubscriptionsList({
  subs,
  onDeleted,
  onEnabled,
  onTested,
  onRotated,
}: Props) {
  const [confirmTarget, setConfirmTarget] = useState<WebhookSubscription | null>(null);
  const [rotateConfirmTarget, setRotateConfirmTarget] = useState<WebhookSubscription | null>(null);
  const [rotatedReveal, setRotatedReveal] = useState<CreateWebhookResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [enablingID, setEnablingID] = useState<string | null>(null);
  const [testingID, setTestingID] = useState<string | null>(null);
  const [rotatingID, setRotatingID] = useState<string | null>(null);
  const [copiedRotated, setCopiedRotated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [rowNotice, setRowNotice] = useState<{ id: string; message: string } | null>(null);

  const handleConfirmDelete = async () => {
    if (!confirmTarget || deleting) return;
    setDeleting(true);
    setErrorMessage('');
    try {
      await deleteWebhook(confirmTarget.id);
      onDeleted(confirmTarget.id);
      setConfirmTarget(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete subscription.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEnable = async (sub: WebhookSubscription) => {
    if (enablingID) return;
    setEnablingID(sub.id);
    setRowError(null);
    try {
      const fresh = await enableWebhook(sub.id);
      onEnabled(fresh);
    } catch (err) {
      setRowError({
        id: sub.id,
        message: err instanceof Error ? err.message : 'Failed to enable subscription.',
      });
    } finally {
      setEnablingID(null);
    }
  };

  const handleConfirmRotate = async () => {
    if (!rotateConfirmTarget || rotatingID) return;
    setRotatingID(rotateConfirmTarget.id);
    setRowError(null);
    setRowNotice(null);
    try {
      const result = await rotateWebhookSecret(rotateConfirmTarget.id);
      onRotated?.(result);
      // Move from "confirm" dialog to "reveal" dialog. The
      // new plaintext is in `result.secret` and we show it
      // once with a copy-to-clipboard affordance.
      setRotateConfirmTarget(null);
      setRotatedReveal(result);
    } catch (err) {
      setRowError({
        id: rotateConfirmTarget.id,
        message: err instanceof Error ? err.message : 'Failed to rotate signing secret.',
      });
      setRotateConfirmTarget(null);
    } finally {
      setRotatingID(null);
    }
  };

  const handleCopyRotated = async () => {
    if (!rotatedReveal) return;
    try {
      await navigator.clipboard.writeText(rotatedReveal.secret);
      setCopiedRotated(true);
      setTimeout(() => setCopiedRotated(false), 2_000);
    } catch {
      // Clipboard may be unavailable in insecure contexts.
    }
  };

  const handleTest = async (sub: WebhookSubscription) => {
    if (testingID) return;
    setTestingID(sub.id);
    setRowError(null);
    setRowNotice(null);
    try {
      const delivery = await testWebhook(sub.id);
      onTested?.(delivery);
      // Inline outcome rather than a toast — the user clicked
      // this button to learn what happened RIGHT HERE.
      if (delivery.status === 'delivered') {
        setRowNotice({
          id: sub.id,
          message: `Test fired — receiver returned 2xx.`,
        });
      } else {
        setRowError({
          id: sub.id,
          message: `Test fired — receiver responded "${delivery.status}". ${
            delivery.lastError ?? ''
          }`,
        });
      }
    } catch (err) {
      setRowError({
        id: sub.id,
        message: err instanceof Error ? err.message : 'Failed to fire test event.',
      });
    } finally {
      setTestingID(null);
    }
  };

  if (subs.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        You haven't subscribed to any events yet. Subscribe to fan events from
        Fyredocs to your own URL — useful for Zapier, custom integrations, or
        forwarding into Slack.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Event</th>
              <th className="px-4 py-2 font-medium">Target</th>
              <th className="px-4 py-2 font-medium">Secret</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Last delivery</th>
              <th className="px-4 py-2 font-medium">Failures</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t align-top" data-testid="webhook-row">
                <td className="px-4 py-2 font-mono text-xs">{s.eventType}</td>
                <td className="px-4 py-2 break-all text-xs text-muted-foreground">{s.targetUrl}</td>
                <td className="px-4 py-2 font-mono text-xs">{s.secretPrefix}…</td>
                <td className="px-4 py-2">
                  <Badge variant={s.status === 'active' ? 'default' : 'destructive'}>
                    {s.status}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {s.lastDeliveryAt ? formatDate(s.lastDeliveryAt) : '—'}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{s.failureCount}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {s.status === 'disabled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleEnable(s)}
                        disabled={enablingID !== null}
                      >
                        {enablingID === s.id ? 'Enabling…' : 'Enable'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleTest(s)}
                      disabled={testingID !== null}
                    >
                      {testingID === s.id ? 'Testing…' : 'Test'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRotateConfirmTarget(s)}
                      disabled={rotatingID !== null}
                    >
                      {rotatingID === s.id ? 'Rotating…' : 'Rotate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmTarget(s)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                  {rowError && rowError.id === s.id && (
                    <p
                      className="mt-1 text-xs text-destructive"
                      role="alert"
                    >
                      {rowError.message}
                    </p>
                  )}
                  {rowNotice && rowNotice.id === s.id && (
                    <p
                      className="mt-1 text-xs text-muted-foreground"
                      role="status"
                    >
                      {rowNotice.message}
                    </p>
                  )}
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
            <AlertDialogTitle>Delete this webhook subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Events for <code className="font-mono">{confirmTarget?.eventType}</code> will stop
              firing to <code className="font-mono break-all">{confirmTarget?.targetUrl}</code>.
              The signing secret you saved at creation can no longer be associated with this
              subscription — create a new one if you need to receive these events again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={rotateConfirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRotateConfirmTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate the signing secret?</AlertDialogTitle>
            <AlertDialogDescription>
              A new secret will replace the current one IMMEDIATELY. Your
              receiver's stored copy will stop verifying signatures until you
              update it with the new value. Use this when you suspect the
              current secret was leaked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rotatingID !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmRotate()}
              disabled={rotatingID !== null}
            >
              {rotatingID !== null ? 'Rotating…' : 'Rotate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={rotatedReveal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRotatedReveal(null);
            setCopiedRotated(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new signing secret</DialogTitle>
            <DialogDescription>
              Shown <strong>only this once</strong>. Update your receiver's
              stored copy now — the previous secret no longer signs anything.
            </DialogDescription>
          </DialogHeader>
          {rotatedReveal && (
            <div className="space-y-3 py-4">
              <code
                data-testid="rotated-secret-plaintext"
                className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-sm"
              >
                {rotatedReveal.secret}
              </code>
              <Button
                type="button"
                onClick={() => void handleCopyRotated()}
                variant="secondary"
                className="w-full"
              >
                {copiedRotated ? 'Copied!' : 'Copy to clipboard'}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setRotatedReveal(null);
                setCopiedRotated(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
