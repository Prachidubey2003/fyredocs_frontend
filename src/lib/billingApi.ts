/**
 * Frontend client for billing-service.
 *
 * Backend wire shapes (see fyredocs_backend/billing-service/handlers/billing.go):
 *   - GET  /api/billing/v1/billing/plans
 *   - GET  /api/billing/v1/billing/me
 *   - POST /api/billing/v1/billing/me/subscribe
 *
 * The standard `{success, message, data}` envelope is unwrapped here so
 * components see a clean Plan/MeResponse shape.
 */

import { apiJson, apiRequest } from './apiClient';

export interface Plan {
  code: string;
  name: string;
  description: string;
  /** USD cents per user per month; -1 = "contact sales". */
  monthlyPriceCents: number;
  yearlyPriceCents?: number;
  perSeat: boolean;
  selfServe: boolean;
  /** Per-event-type caps keyed by `BillableEvent.eventType`; -1 = unlimited. */
  limits: Record<string, number>;
}

export interface Subscription {
  id: string;
  userId: string;
  planCode: string;
  status: 'active' | 'canceled' | 'past_due';
  seats: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRollupRow {
  eventType: string;
  unit: string;
  totalQuantity: number;
  eventCount: number;
}

export interface UsageRollup {
  userId: string;
  period: string;
  items: UsageRollupRow[];
}

export interface MeResponse {
  plan: Plan;
  subscription?: Subscription | null;
  /** Usage section is omitted when analytics-service is unreachable;
   *  components render a "usage unavailable" hint in that case. */
  usage?: UsageRollup | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** List every published plan tier. Anonymous-friendly — drives the pricing page. */
export async function listPlans(): Promise<Plan[]> {
  const env = await apiRequest<ApiEnvelope<{ plans: Plan[] }>>(
    '/api/billing/v1/billing/plans',
    { method: 'GET' },
  );
  return env.data?.plans ?? [];
}

/** Get the calling user's plan + subscription + current-period usage. */
export async function getMe(): Promise<MeResponse> {
  const env = await apiRequest<ApiEnvelope<MeResponse>>(
    '/api/billing/v1/billing/me',
    { method: 'GET' },
  );
  return env.data;
}

/**
 * Switch self-serve plan WITHOUT a payment flow. Used for the
 * Free tier only — paid plans go through `createCheckoutSession`
 * instead (Stripe-hosted card entry).
 *
 * The backend `/v1/billing/me/subscribe` still accepts paid
 * plans for back-compat with admin tools, but the frontend
 * should keep this restricted to Free to avoid bypassing the
 * payment requirement.
 */
export async function subscribe(input: {
  planCode: string;
  seats?: number;
}): Promise<Subscription> {
  const env = await apiJson<ApiEnvelope<Subscription>>(
    '/api/billing/v1/billing/me/subscribe',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return env.data;
}

/**
 * Backend shape returned by POST /v1/billing/checkout/session.
 * The standard `{success, message, data}` envelope is NOT used
 * by this route — billing-service returns a flat object so the
 * SPA can navigate to `url` without unwrapping.
 */
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe Checkout Session for a paid plan. Returns
 * the Stripe-hosted URL; the caller MUST navigate the browser
 * to it (`window.location.assign(url)`).
 *
 * The backend records `user_id` + `plan_code` in the Stripe
 * session's metadata so the subsequent
 * `customer.subscription.created` webhook can update our
 * Subscription row. While the user is on Stripe-hosted pages,
 * our app sees no state change — the success page polls
 * `getMe()` to wait for the webhook-driven update.
 */
export async function createCheckoutSession(input: {
  planCode: string;
  seats?: number;
}): Promise<CheckoutSessionResponse> {
  // Backend returns a flat shape (not the standard envelope) so
  // we type the response directly.
  return apiJson<CheckoutSessionResponse>(
    '/api/billing/v1/billing/checkout/session',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export type MarketplaceEarningStatus = 'pending' | 'payable' | 'paid' | 'reversed';

/**
 * Curated public shape of a single revshare entry — what the
 * backend's `MarketplaceEarning` returns. Internal fields
 * (platform_share_cents, stripe_fee_cents, source_ref) are
 * NOT in this shape; the API strips them server-side.
 */
export interface MarketplaceEarning {
  id: string;
  transactionId: string;
  pluginId: string;
  grossCents: number;
  developerShareCents: number;
  currency: string;
  status: MarketplaceEarningStatus;
  recordedAt: string;
}

export interface MarketplaceEarningsResponse {
  items: MarketplaceEarning[];
  /** Sum of `developerShareCents` across THE RETURNED PAGE
   *  — not a lifetime total. Useful for an at-a-glance "what's
   *  in this view" without a separate query. */
  totalEarnedCents: number;
}

/**
 * Fetches the caller's marketplace earnings ledger.
 * Status filter narrows by lifecycle; limit caps the page
 * (server clamps at 500). Newest first.
 */
export async function listMarketplaceEarnings(opts: {
  status?: MarketplaceEarningStatus;
  limit?: number;
} = {}): Promise<MarketplaceEarningsResponse> {
  const params = new URLSearchParams();
  if (opts.status) params.set('status', opts.status);
  if (opts.limit !== undefined) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const path = `/api/billing/v1/billing/me/marketplace-earnings${qs ? `?${qs}` : ''}`;
  const env = await apiRequest<ApiEnvelope<MarketplaceEarningsResponse>>(path, {
    method: 'GET',
  });
  return env.data ?? { items: [], totalEarnedCents: 0 };
}

/**
 * formatPrice renders a price in dollars with no trailing zeros for
 * common cases. -1 cents (the "contact sales" sentinel) renders as
 * "Custom".
 */
export function formatPrice(cents: number): string {
  if (cents < 0) return 'Custom';
  if (cents === 0) return 'Free';
  const dollars = cents / 100;
  return `$${dollars.toLocaleString(undefined, {
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
