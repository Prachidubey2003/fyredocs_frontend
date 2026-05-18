import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { CreateWebhookDialog } from '@/components/settings/CreateWebhookDialog';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { WebhookDeliveryHistory } from '@/components/settings/WebhookDeliveryHistory';
import { WebhookSubscriptionsList } from '@/components/settings/WebhookSubscriptionsList';
import {
  type WebhookDelivery,
  type WebhookSubscription,
  listWebhookDeliveries,
  listWebhooks,
} from '@/lib/webhooksApi';

/**
 * Account → Webhooks page.
 *
 * Authenticated-only. Manages the caller's webhook subscriptions —
 * external integrations (Zapier, customer scripts) register here to
 * receive signed event POSTs.
 *
 * State machine mirrors ApiKeysPage:
 *   - loading: initial fetch in flight → <PageSkeleton/>.
 *   - error:  fetch failed → banner + Retry.
 *   - ready:  list + Create button.
 *
 * Mutations (create / delete / enable) update local state in place
 * — no refetch round-trip, matches the API-keys page UX.
 */
export default function WebhooksPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [subs, setSubs] = useState<WebhookSubscription[] | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError('');
    // The two fetches are independent — issuing them in parallel
    // keeps page-load latency at ~1× the slower endpoint instead
    // of summing them. Either may fail without taking the other
    // down (subscriptions visible even when delivery history
    // 500s, and vice versa).
    const [subsResult, deliveriesResult] = await Promise.allSettled([
      listWebhooks(),
      listWebhookDeliveries({ limit: 50 }),
    ]);

    if (subsResult.status === 'fulfilled') {
      setSubs(subsResult.value);
    } else {
      setLoadError(
        subsResult.reason instanceof Error
          ? subsResult.reason.message
          : 'Failed to load webhook subscriptions.',
      );
    }
    if (deliveriesResult.status === 'fulfilled') {
      setDeliveries(deliveriesResult.value);
    } else {
      // Don't promote a delivery-history fetch failure to the
      // page-level error banner — subscriptions are the
      // mutation surface and matter more. The history table
      // renders the empty-state which reads naturally even
      // when the fetch silently failed.
      setDeliveries([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refresh();
  }, [isAuthenticated, refresh]);

  if (authLoading) {
    return <PageSkeleton />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: '/account/webhooks' }} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <SettingsTabs />
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Webhooks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Subscribe to Fyredocs events and receive signed HTTPS POSTs at your URL.
            Each request carries an <code className="font-mono">X-Fyredocs-Signature</code>{' '}
            header (HMAC-SHA256) computed with the secret you saved at creation —
            verify it on your side before trusting the payload.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>New subscription</Button>
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

      {subs === null && !loadError ? (
        <PageSkeleton />
      ) : (
        <>
          <WebhookSubscriptionsList
            subs={subs ?? []}
            onDeleted={(id) =>
              setSubs((current) => (current ?? []).filter((s) => s.id !== id))
            }
            onEnabled={(updated) =>
              setSubs((current) =>
                (current ?? []).map((s) => (s.id === updated.id ? updated : s)),
              )
            }
            onTested={(delivery) =>
              setDeliveries((current) => [delivery, ...(current ?? [])])
            }
            onRotated={(updated) =>
              setSubs((current) =>
                (current ?? []).map((s) => (s.id === updated.id ? updated : s)),
              )
            }
          />

          <section className="mt-10">
            <header className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-medium">Recent deliveries</h2>
              <p className="text-xs text-muted-foreground">
                Newest first. Last 50 attempts across all your subscriptions.
              </p>
            </header>
            <WebhookDeliveryHistory deliveries={deliveries ?? []} />
          </section>
        </>
      )}

      <CreateWebhookDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(sub) => setSubs((current) => [sub, ...(current ?? [])])}
      />
    </div>
  );
}
