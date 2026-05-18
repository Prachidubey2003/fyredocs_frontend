import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { ApiKeysList } from '@/components/settings/ApiKeysList';
import { CreateKeyDialog } from '@/components/settings/CreateKeyDialog';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { type ApiKey, listApiKeys } from '@/lib/apiKeysApi';

/**
 * Account → API keys page.
 *
 * Authenticated-only — unauthenticated users redirect to /signin
 * (the rest of the app is mostly anonymous-friendly, but key
 * management belongs to a specific account so we can't render it
 * without an identity).
 *
 * State machine:
 *   - loading: initial fetch in flight; <PageSkeleton/>.
 *   - error: fetch failed; banner + Retry.
 *   - ready: list + Create button.
 *
 * Mutations (create / revoke) update local state in place without
 * a refetch so the table doesn't flicker. Both endpoints are
 * idempotent at the server, so a quick double-click is safe.
 */
export default function ApiKeysPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError('');
    try {
      const fresh = await listApiKeys();
      setKeys(fresh);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load API keys.');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refresh();
  }, [isAuthenticated, refresh]);

  // Wait for the auth probe before deciding to redirect — otherwise
  // first-paint races the cookie-refresh and bounces signed-in
  // users to /signin briefly.
  if (authLoading) {
    return <PageSkeleton />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/account/api-keys' }} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <SettingsTabs />
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">API keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use these keys to call the Fyredocs API from your own services.
            Each key authenticates as your user account; revoke any key you
            no longer need.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>Create key</Button>
      </header>

      {loadError && (
        <div
          className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loadError}{' '}
          <button
            type="button"
            onClick={() => void refresh()}
            className="ml-2 underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {keys === null && !loadError ? (
        <PageSkeleton />
      ) : (
        <ApiKeysList
          keys={keys ?? []}
          onRevoked={(id) =>
            setKeys((current) => (current ?? []).filter((k) => k.id !== id))
          }
        />
      )}

      <CreateKeyDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(key) => setKeys((current) => [key, ...(current ?? [])])}
      />
    </div>
  );
}
