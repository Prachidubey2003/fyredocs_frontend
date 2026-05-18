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
  type ApiKey,
  type ApiKeyEnvironment,
  type IssueApiKeyResponse,
  issueApiKey,
} from '@/lib/apiKeysApi';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly-created key (without plaintext) so the
   *  parent list refreshes without an extra GET round-trip. */
  onCreated: (key: ApiKey) => void;
}

type Stage = 'form' | 'reveal' | 'error';

/**
 * Two-stage modal for creating an API key.
 *
 *  - Stage `form`: name + environment input. Submit calls
 *    POST /auth/api-keys and transitions to `reveal`.
 *  - Stage `reveal`: shows the plaintext token EXACTLY ONCE.
 *    The user must explicitly close the dialog to discard it —
 *    we don't auto-close on copy because copying twice is a
 *    legitimate flow (one for the password manager, one for the
 *    test request).
 *
 * On close from `reveal` we wipe `revealed` from component state
 * so a re-open of the dialog after this can't redisplay an old
 * plaintext (defence-in-depth — the bytes are also unreachable
 * from the server, but no harm in being explicit).
 */
export function CreateKeyDialog({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<ApiKeyEnvironment>('live');
  const [stage, setStage] = useState<Stage>('form');
  const [revealed, setRevealed] = useState<IssueApiKeyResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setName('');
    setEnvironment('live');
    setStage('form');
    setRevealed(null);
    setErrorMessage('');
    setSubmitting(false);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setErrorMessage('Name is required.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const result = await issueApiKey({ name: trimmed, environment });
      setRevealed(result);
      onCreated(result.key);
      setStage('reveal');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create key.');
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
      await navigator.clipboard.writeText(revealed.plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      // Clipboard may be unavailable in insecure contexts (older
      // self-hosted dev). Leaving `copied` false signals "select
      // the text manually" via the unchanged button label.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {stage === 'form' && (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                Generates a new key for programmatic access. You'll see the secret only once — copy it immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Name</Label>
                <Input
                  id="api-key-name"
                  placeholder="e.g. CI pipeline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={64}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key-env">Environment</Label>
                <Select
                  value={environment}
                  onValueChange={(v) => setEnvironment(v as ApiKeyEnvironment)}
                >
                  <SelectTrigger id="api-key-env">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                  </SelectContent>
                </Select>
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
                {submitting ? 'Creating…' : 'Create key'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {stage === 'reveal' && revealed && (
          <>
            <DialogHeader>
              <DialogTitle>Your new API key</DialogTitle>
              <DialogDescription>
                This secret is shown <strong>only this once</strong>. Copy it now —
                you won't be able to view it again. If you lose it, revoke and create a new key.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <code
                data-testid="api-key-plaintext"
                className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-sm"
              >
                {revealed.plaintext}
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
              <DialogTitle>Couldn't create the key</DialogTitle>
              <DialogDescription>{errorMessage || 'An unexpected error occurred.'}</DialogDescription>
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
