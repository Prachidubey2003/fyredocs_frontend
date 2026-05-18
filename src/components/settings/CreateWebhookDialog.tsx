import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type CreateWebhookResponse,
  type WebhookEventType,
  type WebhookSubscription,
  WEBHOOK_EVENT_TYPES,
  createWebhook,
} from '@/lib/webhooksApi';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly-created subscription (without the
   *  plaintext secret) so the parent list refreshes without an
   *  extra GET. */
  onCreated: (sub: WebhookSubscription) => void;
}

type Stage = 'form' | 'reveal' | 'error';

/**
 * Two-stage modal for creating a webhook subscription.
 *
 *  - Stage `form`: event-type dropdown + target-URL input.
 *    Submit calls POST /v1/notify/webhooks and transitions to
 *    `reveal`.
 *  - Stage `reveal`: shows the plaintext signing secret EXACTLY
 *    ONCE with a copy-to-clipboard affordance. User must
 *    explicitly close the dialog — never auto-close on copy
 *    (copying twice is legitimate: password manager + manual
 *    test request).
 *
 * On close from `reveal` we wipe `revealed` from component state
 * so a re-open of the dialog after this can't redisplay an old
 * plaintext (defence-in-depth — the bytes are also unreachable
 * from the server, but no harm in being explicit).
 *
 * Same structural shape as CreateKeyDialog — mirrors the API-key
 * UX so users get a consistent "once-shown secret" experience.
 */
export function CreateWebhookDialog({ open, onOpenChange, onCreated }: Props) {
  const [eventType, setEventType] = useState<WebhookEventType>('job.completed');
  const [targetUrl, setTargetUrl] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [revealed, setRevealed] = useState<CreateWebhookResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEventType('job.completed');
    setTargetUrl('');
    setStage('form');
    setRevealed(null);
    setErrorMessage('');
    setSubmitting(false);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = targetUrl.trim();
    if (trimmed.length === 0) {
      setErrorMessage('Target URL is required.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const result = await createWebhook({ eventType, targetUrl: trimmed });
      setRevealed(result);
      // Strip secret + plaintext-equivalent fields before
      // handing the row to the parent — the parent list never
      // displays the secret, so we hand it the shape it
      // expects (the response WITHOUT the `secret` field).
      const { secret: _secret, ...sub } = result;
      void _secret;
      onCreated(sub);
      setStage('reveal');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to create webhook subscription.',
      );
      setStage('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  };

  const handleCopy = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      // Clipboard may be unavailable in insecure contexts.
      // Leaving `copied` false signals "select the text
      // manually" via the unchanged button label.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {stage === 'form' && (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>New webhook subscription</DialogTitle>
              <DialogDescription>
                Fyredocs will POST signed JSON to your URL when the selected
                event fires for your account. Use this for Zapier triggers,
                Slack notifications, or custom integrations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-event-type">Event</Label>
                <Select
                  value={eventType}
                  onValueChange={(v) => setEventType(v as WebhookEventType)}
                >
                  <SelectTrigger id="webhook-event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBHOOK_EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-target-url">Target URL</Label>
                <Input
                  id="webhook-target-url"
                  placeholder="https://hooks.example.com/fyredocs"
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  maxLength={2048}
                  autoFocus
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be <code>https://</code> for production endpoints (
                  <code>http://localhost</code> allowed for development).
                </p>
              </div>
              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create subscription'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {stage === 'reveal' && revealed && (
          <>
            <DialogHeader>
              <DialogTitle>Your signing secret</DialogTitle>
              <DialogDescription>
                This secret is shown <strong>only this once</strong>. Save it
                in your subscriber's config so it can verify the{' '}
                <code className="font-mono">X-Fyredocs-Signature</code> header
                on every incoming request. If you lose it, delete this
                subscription and create a new one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <code
                data-testid="webhook-secret-plaintext"
                className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-sm"
              >
                {revealed.secret}
              </code>
              <Button type="button" onClick={handleCopy} variant="secondary" className="w-full">
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        )}

        {stage === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle>Couldn't create the subscription</DialogTitle>
              <DialogDescription>
                {errorMessage || 'An unexpected error occurred.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setStage('form')}>Try again</Button>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
