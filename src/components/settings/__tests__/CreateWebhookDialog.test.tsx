import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { render } from '@/test/test-utils';
import { CreateWebhookDialog } from '../CreateWebhookDialog';

const sampleCreated = {
  id: 'wh_1',
  userId: 'u1',
  eventType: 'job.completed' as const,
  targetUrl: 'https://hooks.example.com/fyredocs',
  secretPrefix: 'whsec_abc',
  status: 'active' as const,
  failureCount: 0,
  lastDeliveryAt: null,
  createdAt: '2026-05-18T00:00:00Z',
  updatedAt: '2026-05-18T00:00:00Z',
  // The plaintext secret is the once-shown field. The backend
  // returns it inline at this layer (per createWebhook's flat
  // shape) and the dialog reveals it then strips it from the
  // value handed to onCreated.
  secret: 'whsec_abcdEFGH1234567890supersecret',
};

describe('CreateWebhookDialog', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('reveals the plaintext secret exactly once after a successful create', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(sampleCreated), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const onCreated = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <CreateWebhookDialog open={true} onOpenChange={onOpenChange} onCreated={onCreated} />,
    );

    // Stage 1: form. Fill the URL and submit.
    fireEvent.change(screen.getByLabelText(/Target URL/i), {
      target: { value: 'https://hooks.example.com/fyredocs' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create subscription/i }));

    // Stage 2: reveal — the once-shown secret lands in the
    // DOM via the dedicated testid.
    const reveal = await screen.findByTestId('webhook-secret-plaintext');
    expect(reveal).toHaveTextContent(sampleCreated.secret);
    // onCreated must receive the subscription WITHOUT the
    // plaintext — the parent list never displays it and the
    // shape it expects (WebhookSubscription) has no `secret`.
    expect(onCreated).toHaveBeenCalledTimes(1);
    const handed = onCreated.mock.calls[0][0];
    expect(handed.id).toBe('wh_1');
    expect(handed.secret).toBeUndefined();
  });

  it('sends eventType + targetUrl in the request body with the form defaults', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(sampleCreated), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );

    render(<CreateWebhookDialog open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Target URL/i), {
      target: { value: 'https://hooks.example.com/fyredocs' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create subscription/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
    const [, init] = fetchSpy.mock.calls[0];
    expect((init as RequestInit).method).toBe('POST');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({
      eventType: 'job.completed',
      targetUrl: 'https://hooks.example.com/fyredocs',
    });
  });

  it('transitions to the error stage when the server rejects the request', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_TARGET_URL', details: 'Target URL must be https://' },
        }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
    );

    render(<CreateWebhookDialog open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Target URL/i), {
      target: { value: 'https://hooks.example.com/fyredocs' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create subscription/i }));

    await waitFor(() => {
      // The error-stage heading is the "Couldn't create the
      // subscription" title — pin it so a refactor that
      // collapsed the error stage into the form stage would
      // be caught.
      expect(
        screen.getByRole('heading', { name: /Couldn.t create the subscription/i }),
      ).toBeInTheDocument();
    });
    // The server's `details` field is surfaced verbatim so
    // the user knows WHY the create failed.
    expect(screen.getByText(/Target URL must be https/i)).toBeInTheDocument();
    // Try again should return the user to the form stage on
    // click.
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });

  it('Try again returns the error stage to the form stage', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ success: false, error: { details: 'transient' } }),
        { status: 503, headers: { 'content-type': 'application/json' } },
      ),
    );
    render(<CreateWebhookDialog open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Target URL/i), {
      target: { value: 'https://hooks.example.com/fyredocs' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create subscription/i }));

    const tryAgain = await screen.findByRole('button', { name: /Try again/i });
    fireEvent.click(tryAgain);

    // Back on the form — the Target URL field is the
    // canonical landmark.
    expect(screen.getByLabelText(/Target URL/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Couldn.t create the subscription/i }),
    ).not.toBeInTheDocument();
  });

  it('refuses to submit with an empty target URL (no fetch fired)', () => {
    render(<CreateWebhookDialog open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />);
    // The HTML5 `required` attribute prevents form submission
    // when the URL field is empty — clicking Create with no
    // input should yield zero network calls.
    fireEvent.click(screen.getByRole('button', { name: /Create subscription/i }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('copies the plaintext secret to the clipboard and flips the button label', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(sampleCreated), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    // JSDOM doesn't ship navigator.clipboard by default — stub
    // it so the dialog's writeText call resolves.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(<CreateWebhookDialog open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Target URL/i), {
      target: { value: 'https://hooks.example.com/fyredocs' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create subscription/i }));

    // Wait for reveal stage.
    await screen.findByTestId('webhook-secret-plaintext');
    const copyBtn = screen.getByRole('button', { name: /Copy to clipboard/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(sampleCreated.secret);
    });
    // Button label flips to "Copied!" — the visual
    // confirmation users rely on. The two-second
    // auto-reset is timer-driven; we only assert the
    // immediate flip.
    expect(await screen.findByRole('button', { name: /Copied!/ })).toBeInTheDocument();
  });

  it('does NOT redisplay the previous secret after close + re-open', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify(sampleCreated), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <CreateWebhookDialog open={true} onOpenChange={onOpenChange} onCreated={vi.fn()} />,
    );

    // Run the form → reveal sequence.
    fireEvent.change(screen.getByLabelText(/Target URL/i), {
      target: { value: 'https://hooks.example.com/fyredocs' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Create subscription/i }));
    await screen.findByTestId('webhook-secret-plaintext');

    // Close the dialog (Done button calls handleClose(false)
    // which calls reset() before onOpenChange(false)).
    fireEvent.click(screen.getByRole('button', { name: /Done/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // Re-open with the same component instance — the prior
    // `revealed` state must NOT linger; the form stage owns
    // the dialog body.
    rerender(
      <CreateWebhookDialog open={false} onOpenChange={onOpenChange} onCreated={vi.fn()} />,
    );
    rerender(
      <CreateWebhookDialog open={true} onOpenChange={onOpenChange} onCreated={vi.fn()} />,
    );

    // Form-stage landmark is the Target URL field. The
    // reveal stage's plaintext testid must be gone.
    expect(screen.getByLabelText(/Target URL/i)).toBeInTheDocument();
    expect(screen.queryByTestId('webhook-secret-plaintext')).not.toBeInTheDocument();
  });

  it('Cancel closes the dialog without firing a network call', () => {
    render(<CreateWebhookDialog open={true} onOpenChange={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/ }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
