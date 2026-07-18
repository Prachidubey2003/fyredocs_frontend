import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { CookieConsent } from './CookieConsent';
import { getConsent, hasConsentDecision, openCookiePreferences } from '@/lib/consent';

const KEY = 'fyredocs:cookieConsent';

/**
 * Force the browser timezone the region gate reads from, while keeping the rest of
 * Intl.DateTimeFormat real (render paths may format dates).
 */
function mockTimeZone(tz: string) {
  const RealDTF = Intl.DateTimeFormat;
  vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(((...args: unknown[]) => {
    const inst = new (RealDTF as unknown as new (...a: unknown[]) => Intl.DateTimeFormat)(...args);
    const realResolved = inst.resolvedOptions.bind(inst);
    inst.resolvedOptions = () => ({ ...realResolved(), timeZone: tz });
    return inst;
  }) as unknown as typeof Intl.DateTimeFormat);
}

const storeDecision = () =>
  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      categories: { necessary: true, analytics: false, marketing: false },
      version: 1,
      ts: Date.now(),
    })
  );

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CookieConsent', () => {
  it('auto-shows in a consent-required (EU) region when undecided', () => {
    mockTimeZone('Europe/Berlin');
    render(<CookieConsent />);
    expect(screen.getByRole('dialog', { name: /cookie consent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept all/i })).toBeInTheDocument();
  });

  it('does NOT auto-show outside consent-required regions', () => {
    mockTimeZone('Asia/Kolkata');
    render(<CookieConsent />);
    expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
  });

  it('Accept all stores marketing consent and hides the banner', async () => {
    mockTimeZone('Europe/Berlin');
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole('button', { name: /accept all/i }));

    await waitFor(() => expect(getConsent()?.categories.marketing).toBe(true));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument()
    );
  });

  it('Reject all records a decision with marketing off', async () => {
    mockTimeZone('Europe/Berlin');
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole('button', { name: /reject all/i }));

    await waitFor(() => expect(hasConsentDecision()).toBe(true));
    expect(getConsent()?.categories.marketing).toBe(false);
  });

  it('does not render when a decision already exists (any region)', () => {
    mockTimeZone('Europe/Berlin');
    storeDecision();
    render(<CookieConsent />);
    expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();
  });

  it('reopens the preferences dialog on the consent-open event, even outside the EU', async () => {
    mockTimeZone('Asia/Kolkata'); // non-EU: no auto banner
    render(<CookieConsent />);
    expect(screen.queryByRole('dialog', { name: /cookie consent/i })).not.toBeInTheDocument();

    openCookiePreferences();

    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: /cookie preferences/i })).toBeInTheDocument()
    );
  });
});
