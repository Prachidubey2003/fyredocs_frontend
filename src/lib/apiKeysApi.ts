/**
 * Frontend client for auth-service's API-key endpoints.
 *
 * Backend wire format (see fyredocs_backend/auth-service/handlers/api_keys.go):
 *   - POST   /auth/api-keys          → IssueAPIKey
 *   - GET    /auth/api-keys?revoked= → ListAPIKeys
 *   - POST   /auth/api-keys/:id/revoke → RevokeAPIKey
 *
 * All responses use the standard `{success, message, data}` envelope from
 * fyredocs/shared/response — this client unwraps `data` for the caller.
 *
 * The plaintext token is shown EXACTLY ONCE in the IssueAPIKey response.
 * The list endpoint never returns it (the hash never leaves the server).
 * Components are responsible for keeping the plaintext visible just long
 * enough for the user to copy it, then discarding the in-memory copy.
 */

import { apiJson, apiRequest } from './apiClient';

export type ApiKeyEnvironment = 'live' | 'test';

/** API key row as persisted on the server (never includes plaintext). */
export interface ApiKey {
  id: string;
  ownerUserId: string;
  name: string;
  environment: ApiKeyEnvironment;
  /** Short identifier shown in the UI (`fyr_live_abc123`). */
  keyPrefix: string;
  /** Optional JSON-array of scope strings; empty when inheriting the
   *  caller's full scope set. */
  scopes?: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
}

/** Response from POST /auth/api-keys. `plaintext` is shown once. */
export interface IssueApiKeyResponse {
  key: ApiKey;
  plaintext: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Lists the caller's API keys. By default returns only active keys
 * (revoked filtered out); pass `revoked: true` to fetch the audit
 * archive.
 */
export async function listApiKeys(opts: { revoked?: boolean } = {}): Promise<ApiKey[]> {
  const params = new URLSearchParams();
  if (opts.revoked !== undefined) {
    params.set('revoked', opts.revoked ? 'true' : 'false');
  }
  const qs = params.toString();
  const path = `/auth/api-keys${qs ? `?${qs}` : ''}`;
  const env = await apiRequest<ApiEnvelope<ApiKey[] | null>>(path, { method: 'GET' });
  return env.data ?? [];
}

/**
 * Mints a new API key. The plaintext in the response is the only
 * place the unhashed secret is ever exposed; the caller MUST surface
 * it to the user (with a copy-to-clipboard affordance) and warn that
 * it won't be shown again.
 */
export async function issueApiKey(input: {
  name: string;
  environment?: ApiKeyEnvironment;
  scopes?: string[];
}): Promise<IssueApiKeyResponse> {
  const env = await apiJson<ApiEnvelope<IssueApiKeyResponse>>('/auth/api-keys', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return env.data;
}

/**
 * Revokes a key. Idempotent on the server — re-revoking a key is a
 * 204 no-op so the UI can call this on confirmation without worrying
 * about double-clicks.
 */
export async function revokeApiKey(id: string): Promise<void> {
  await apiRequest<void>(`/auth/api-keys/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
  });
}
