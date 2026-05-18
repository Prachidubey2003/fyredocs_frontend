import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { issueApiKey, listApiKeys, revokeApiKey } from '../apiKeysApi';

// Each test installs a controlled fetch mock so we can verify the
// path, method, body, and credentials policy without touching a
// real server. apiClient.ts uses `fetch` directly + `credentials: 'include'`,
// so the assertions here cover both the wire shape and the auth-cookie
// posture.

describe('apiKeysApi', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const okJson = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  describe('listApiKeys', () => {
    it('GETs /auth/api-keys and unwraps the envelope', async () => {
      const sample = [
        {
          id: 'k1',
          ownerUserId: 'u1',
          name: 'CI',
          environment: 'live' as const,
          keyPrefix: 'fyr_live_abc',
          createdAt: '2026-05-01T00:00:00Z',
        },
      ];
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: sample }));

      const got = await listApiKeys();
      expect(got).toEqual(sample);

      const [url, init] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/auth/api-keys');
      expect((init as RequestInit).method).toBe('GET');
      expect((init as RequestInit).credentials).toBe('include');
    });

    it('passes ?revoked=true when requested', async () => {
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: [] }));
      await listApiKeys({ revoked: true });

      const [url] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('revoked=true');
    });

    it('returns empty array when server returns null data', async () => {
      // The server returns `data: null` for users who have no keys
      // — exercising the `?? []` safety in the client.
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: null }));
      const got = await listApiKeys();
      expect(got).toEqual([]);
    });
  });

  describe('issueApiKey', () => {
    it('POSTs /auth/api-keys with JSON body + returns plaintext-bearing payload', async () => {
      const payload = {
        key: {
          id: 'k2',
          ownerUserId: 'u1',
          name: 'CI pipeline',
          environment: 'live' as const,
          keyPrefix: 'fyr_live_xyz',
          createdAt: '2026-05-16T00:00:00Z',
        },
        plaintext: 'fyr_live_xyz_supersecrettoken',
      };
      fetchSpy.mockResolvedValueOnce(okJson({ success: true, data: payload }));

      const got = await issueApiKey({ name: 'CI pipeline', environment: 'live' });
      expect(got).toEqual(payload);

      const [, init] = fetchSpy.mock.calls[0];
      expect((init as RequestInit).method).toBe('POST');
      expect((init as RequestInit).headers).toBeDefined();
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body).toEqual({ name: 'CI pipeline', environment: 'live' });
    });

    it('surfaces the server error message when the call fails', async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INVALID_INPUT', details: 'name is required' },
          }),
          { status: 400, headers: { 'content-type': 'application/json' } },
        ),
      );

      await expect(issueApiKey({ name: '' })).rejects.toThrow('name is required');
    });
  });

  describe('revokeApiKey', () => {
    it('POSTs the revoke endpoint with the URL-encoded id', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));

      await revokeApiKey('k 1');

      const [url, init] = fetchSpy.mock.calls[0];
      // URL encoding: a space in the path becomes %20.
      expect(String(url)).toContain('/auth/api-keys/k%201/revoke');
      expect((init as RequestInit).method).toBe('POST');
    });
  });
});
