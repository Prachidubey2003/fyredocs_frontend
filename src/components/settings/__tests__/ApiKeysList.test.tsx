import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { render } from '@/test/test-utils';
import { ApiKeysList } from '../ApiKeysList';

const keyLive = {
  id: 'k1',
  ownerUserId: 'u1',
  name: 'CI pipeline',
  environment: 'live' as const,
  keyPrefix: 'fyr_live_abc',
  createdAt: '2026-05-01T00:00:00Z',
  lastUsedAt: '2026-05-17T12:00:00Z',
};

const keyTest = {
  id: 'k2',
  ownerUserId: 'u1',
  name: 'Local debug',
  environment: 'test' as const,
  keyPrefix: 'fyr_test_xyz',
  createdAt: '2026-04-15T00:00:00Z',
  lastUsedAt: null,
};

describe('ApiKeysList', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the dashed empty-state hint when there are no keys', () => {
    render(<ApiKeysList keys={[]} onRevoked={vi.fn()} />);
    expect(
      screen.getByText(/You haven't created any API keys yet/i),
    ).toBeInTheDocument();
    // The table is not rendered in the empty state.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders one row per key with name, environment, prefix, and date columns', () => {
    render(<ApiKeysList keys={[keyLive, keyTest]} onRevoked={vi.fn()} />);
    const rows = screen.getAllByTestId('api-key-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('CI pipeline')).toBeInTheDocument();
    expect(screen.getByText('Local debug')).toBeInTheDocument();
    expect(screen.getByText('fyr_live_abc')).toBeInTheDocument();
    expect(screen.getByText('fyr_test_xyz')).toBeInTheDocument();
    // Environment badge text.
    expect(screen.getByText('live')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('renders an em-dash when lastUsedAt is null', () => {
    render(<ApiKeysList keys={[keyTest]} onRevoked={vi.fn()} />);
    // keyTest has lastUsedAt: null — the cell should show "—"
    // rather than the literal "null" or a broken date.
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('opens the confirm dialog (and does NOT fire fetch) on Revoke click', () => {
    render(<ApiKeysList keys={[keyLive]} onRevoked={vi.fn()} />);
    // The dialog should not be open before the click.
    expect(
      screen.queryByRole('alertdialog', { name: /Revoke this API key/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Revoke$/ }));

    // AlertDialog uses role="alertdialog" via radix.
    expect(
      screen.getByRole('alertdialog', { name: /Revoke this API key/i }),
    ).toBeInTheDocument();
    // The dialog should mention the specific prefix being
    // revoked — important so the user can confirm they're
    // killing the right credential, not just "an API key".
    // The prefix appears in BOTH the table row and the dialog
    // body, so assert ≥ 2 matches rather than uniqueness.
    expect(screen.getAllByText('fyr_live_abc').length).toBeGreaterThanOrEqual(2);
    // No fetch yet — revocation is gated behind the dialog's
    // Revoke button.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('Cancel closes the dialog without firing a revoke', () => {
    render(<ApiKeysList keys={[keyLive]} onRevoked={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Revoke$/ }));

    // The dialog footer Cancel button is the secondary action.
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/ }));

    expect(
      screen.queryByRole('alertdialog', { name: /Revoke this API key/i }),
    ).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fires POST /auth/api-keys/{id}/revoke on confirm + calls onRevoked with the key id', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const onRevoked = vi.fn();
    render(<ApiKeysList keys={[keyLive]} onRevoked={onRevoked} />);

    // Open the confirm dialog, then click the action button
    // INSIDE the dialog (matches the "Revoke" label, not
    // "Revoking…").
    fireEvent.click(screen.getByRole('button', { name: /^Revoke$/ }));
    const dialog = screen.getByRole('alertdialog', { name: /Revoke this API key/i });
    const actionBtn = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent === 'Revoke',
    );
    expect(actionBtn).toBeTruthy();
    fireEvent.click(actionBtn!);

    await waitFor(() => {
      expect(onRevoked).toHaveBeenCalledWith('k1');
    });
    // Wire shape: POST to /auth/api-keys/{id}/revoke. The
    // backend treats revoke as an action endpoint (idempotent
    // POST) rather than a DELETE — the row stays for audit
    // and only the credential is invalidated.
    const [url, init] = fetchSpy.mock.calls[0];
    expect((init as RequestInit).method).toBe('POST');
    expect(String(url)).toContain('/auth/api-keys/k1/revoke');
  });

  it('keeps the dialog open with an inline error message when the revoke fails', async () => {
    // The handler preventDefault's radix's auto-close, then
    // sets `errorMessage` on the catch path so the user sees
    // WHY the revoke failed and can decide to retry vs cancel.
    // Without preventDefault the dialog would dismiss before
    // the catch fires and the message would never render.
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'KEY_ALREADY_REVOKED', details: 'Key already revoked.' },
        }),
        { status: 409, headers: { 'content-type': 'application/json' } },
      ),
    );
    const onRevoked = vi.fn();
    render(<ApiKeysList keys={[keyLive]} onRevoked={onRevoked} />);

    fireEvent.click(screen.getByRole('button', { name: /^Revoke$/ }));
    const dialog = screen.getByRole('alertdialog', { name: /Revoke this API key/i });
    const actionBtn = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent === 'Revoke',
    )!;
    fireEvent.click(actionBtn);

    // Error banner inside the dialog (role="alert") carries
    // the server's details verbatim. waitFor handles the
    // async catch path.
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => /already revoked/i.test(el.textContent ?? ''))).toBe(true);
    });
    // Parent's in-memory list MUST NOT shrink — revoke
    // didn't actually succeed.
    expect(onRevoked).not.toHaveBeenCalled();
    // Dialog STAYS OPEN so the user can read the error and
    // pick a follow-up action.
    expect(
      screen.getByRole('alertdialog', { name: /Revoke this API key/i }),
    ).toBeInTheDocument();
  });

  it('clears the error message on Cancel + re-open so a stale error never leaks across attempts', async () => {
    // First revoke fails; user dismisses + re-opens the
    // dialog to try again. The error from the prior failed
    // attempt MUST be wiped — otherwise a fresh confirm
    // would show a misleading stale banner.
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, error: { details: 'transient' } }),
        { status: 503, headers: { 'content-type': 'application/json' } },
      ),
    );
    render(<ApiKeysList keys={[keyLive]} onRevoked={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^Revoke$/ }));
    const dialog = screen.getByRole('alertdialog', { name: /Revoke this API key/i });
    const actionBtn = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent === 'Revoke',
    )!;
    fireEvent.click(actionBtn);

    // Wait for the error banner to land.
    await waitFor(() => {
      expect(
        screen.getAllByRole('alert').some((el) => /transient/i.test(el.textContent ?? '')),
      ).toBe(true);
    });
    // Cancel — the onOpenChange path clears both target and
    // errorMessage.
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/ }));
    // Re-open the dialog.
    fireEvent.click(screen.getByRole('button', { name: /^Revoke$/ }));
    // The error message MUST NOT survive the close/re-open
    // cycle.
    const alerts = screen.queryAllByRole('alert');
    expect(alerts.some((el) => /transient/i.test(el.textContent ?? ''))).toBe(false);
  });
});
