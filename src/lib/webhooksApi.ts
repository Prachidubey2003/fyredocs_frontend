/**
 * Frontend client for notify-service's webhook-subscription endpoints.
 *
 * Backend wire shapes (see fyredocs_backend/notify-service/handlers/webhooks.go):
 *   - POST   /api/notify/v1/notify/webhooks               → CreateWebhook
 *   - GET    /api/notify/v1/notify/webhooks               → ListWebhooks
 *   - DELETE /api/notify/v1/notify/webhooks/:id           → DeleteWebhook
 *   - POST   /api/notify/v1/notify/webhooks/:id/enable    → EnableWebhook
 *
 * Standard `{success, message, data}` envelope is unwrapped here so
 * components see clean shapes.
 *
 * The plaintext `secret` is exposed ONLY in the create response.
 * Subsequent list responses surface `secretPrefix` (first 8 chars)
 * so users can identify a key during rotation, but never the full
 * value. Components MUST surface the plaintext on creation with a
 * copy-to-clipboard affordance — there's no way to retrieve it
 * later.
 */

import { apiJson, apiRequest } from './apiClient';

/** Status of a subscription on the server. */
export type WebhookStatus = 'active' | 'disabled';

/** Event types webhook subscriptions can register for. Kept in
 *  lockstep with `allowedEventTypes` in
 *  notify-service/handlers/webhooks.go. */
export const WEBHOOK_EVENT_TYPES = [
  'job.completed',
  'job.failed',
  'document.created',
  'document.updated',
  'document.signed',
  'subscription.created',
  'subscription.changed',
  'subscription.canceled',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

/** Subscription row as the server returns it. The plaintext
 *  secret + bcrypt-equivalent ciphertext are NEVER in this shape
 *  (json:"-" on the backend); only `secretPrefix` is visible. */
export interface WebhookSubscription {
  id: string;
  userId: string;
  eventType: WebhookEventType;
  targetUrl: string;
  secretPrefix: string;
  status: WebhookStatus;
  failureCount: number;
  lastDeliveryAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Response from POST /v1/notify/webhooks. `secret` is shown once. */
export interface CreateWebhookResponse extends WebhookSubscription {
  /** Plaintext signing secret. Stored ONLY by the user. */
  secret: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Lists the caller's webhook subscriptions, newest first. */
export async function listWebhooks(): Promise<WebhookSubscription[]> {
  const env = await apiRequest<ApiEnvelope<{ subscriptions: WebhookSubscription[] }>>(
    '/api/notify/v1/notify/webhooks',
    { method: 'GET' },
  );
  return env.data?.subscriptions ?? [];
}

/**
 * Creates a new webhook subscription. Returns the row + the
 * plaintext secret — the caller MUST surface that secret to the
 * user (it's never retrievable again).
 *
 * Backend returns the subscription fields as a FLAT shape (NOT
 * wrapped in `{success, message, data}`) — this is the same
 * convention the Stripe checkout endpoint uses. We parse it
 * directly.
 */
export async function createWebhook(input: {
  eventType: WebhookEventType;
  targetUrl: string;
}): Promise<CreateWebhookResponse> {
  return apiJson<CreateWebhookResponse>('/api/notify/v1/notify/webhooks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Soft-deletes a subscription. Idempotent on the server. */
export async function deleteWebhook(id: string): Promise<void> {
  await apiRequest<void>(
    `/api/notify/v1/notify/webhooks/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

/**
 * Generates a fresh signing secret for an existing
 * subscription and returns the plaintext exactly once. The
 * old secret becomes invalid immediately (no grace window)
 * — use this when you suspect the previous secret was
 * leaked. The receiver's stored copy needs updating with
 * the new plaintext before the next event lands.
 *
 * Returns the full `CreateWebhookResponse` shape (subscription
 * row + `secret` field), same as the create endpoint, so the
 * UI can reuse the same "once-shown plaintext" reveal flow.
 */
export async function rotateWebhookSecret(id: string): Promise<CreateWebhookResponse> {
  return apiJson<CreateWebhookResponse>(
    `/api/notify/v1/notify/webhooks/${encodeURIComponent(id)}/rotate-secret`,
    { method: 'POST' },
  );
}

/**
 * Fires a synthetic `webhook.test` event at the subscription's
 * target URL using the recovered per-row signing secret. Lets
 * the user verify their receiver works without waiting for a
 * real event. Returns the resulting Delivery row — the SPA
 * renders status + lastError inline so failures show up next
 * to the test button.
 *
 * Does NOT touch the circuit breaker — a test failure is a UX
 * signal, not "your subscriber is broken".
 */
export async function testWebhook(id: string): Promise<WebhookDelivery> {
  const env = await apiJson<ApiEnvelope<{ delivery: WebhookDelivery }>>(
    `/api/notify/v1/notify/webhooks/${encodeURIComponent(id)}/test`,
    { method: 'POST' },
  );
  return env.data.delivery;
}

/**
 * Re-enables a subscription the circuit breaker auto-disabled
 * (or pre-emptively resets the failure counter on a healthy
 * row). Idempotent.
 */
export async function enableWebhook(id: string): Promise<WebhookSubscription> {
  const env = await apiJson<ApiEnvelope<WebhookSubscription>>(
    `/api/notify/v1/notify/webhooks/${encodeURIComponent(id)}/enable`,
    { method: 'POST' },
  );
  return env.data;
}

/** Per-delivery audit row from notify-service's
 *  `notify_deliveries` table. One row per dispatch attempt —
 *  success or failure. Surfaces "did Fyredocs actually try
 *  to POST, and what did the receiver say". */
export interface WebhookDelivery {
  id: string;
  userId?: string | null;
  channel: 'email' | 'webhook' | 'push' | 'slack';
  target: string;
  status: 'pending' | 'delivered' | 'failed' | 'skipped';
  attempts: number;
  payload?: unknown;
  lastError?: string;
  idempotencyKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lists the caller's recent webhook deliveries. By default
 * filters to `channel=webhook` so the Webhooks UI doesn't
 * surface email/push/slack rows that belong to other surfaces.
 * Caller can override `channel` (or pass `''` to see all).
 */
export async function listWebhookDeliveries(opts: {
  channel?: string;
  limit?: number;
} = {}): Promise<WebhookDelivery[]> {
  const params = new URLSearchParams();
  const channel = opts.channel ?? 'webhook';
  if (channel) {
    params.set('channel', channel);
  }
  if (opts.limit !== undefined) {
    params.set('limit', String(opts.limit));
  }
  const qs = params.toString();
  const path = `/api/notify/v1/notify/deliveries${qs ? `?${qs}` : ''}`;
  const env = await apiRequest<ApiEnvelope<{ items: WebhookDelivery[] | null }>>(path, {
    method: 'GET',
  });
  return env.data?.items ?? [];
}
