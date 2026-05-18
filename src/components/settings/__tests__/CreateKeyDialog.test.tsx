import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { render } from '@/test/test-utils';
import { CreateKeyDialog } from '../CreateKeyDialog';

const sampleResponse = {
  key: {
    id: 'k1',
    ownerUserId: 'u1',
    name: 'CI pipeline',
    environment: 'live' as const,
    keyPrefix: 'fyr_live_abc',
    createdAt: '2026-05-16T00:00:00Z',
  },
  plaintext: 'fyr_live_abc_supersecrettoken',
};

describe('CreateKeyDialog', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('reveals the plaintext token exactly once after a successful create', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: sampleResponse }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const onCreated = vi.fn();
    const onOpenChange = vi.fn();
    render(<CreateKeyDialog open={true} onOpenChange={onOpenChange} onCreated={onCreated} />);

    // Stage 1: form. Fill the name and submit.
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'CI pipeline' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create key/i }));

    // Stage 2: reveal. Plaintext is in the DOM exactly once.
    const reveal = await screen.findByTestId('api-key-plaintext');
    expect(reveal).toHaveTextContent(sampleResponse.plaintext);
    expect(onCreated).toHaveBeenCalledWith(sampleResponse.key);
  });

  it('shows the server error message on failure', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_INPUT', details: 'name must be 1-64 chars' },
        }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
    );

    render(
      <CreateKeyDialog open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'ok' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create key/i }));

    await waitFor(() => {
      expect(screen.getByText(/name must be 1-64 chars/i)).toBeInTheDocument();
    });
    // Stage transitioned to `error` — Try again button is present.
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('refuses to submit with an empty name', async () => {
    render(
      <CreateKeyDialog open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />,
    );
    // Browsers' built-in `required` validation prevents submit;
    // we additionally trim the value client-side and show our
    // own error. The HTML5 invalid event keeps the form on stage
    // `form`, so we just assert no network call goes out when the
    // user clicks submit.
    fireEvent.click(screen.getByRole('button', { name: /create key/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
