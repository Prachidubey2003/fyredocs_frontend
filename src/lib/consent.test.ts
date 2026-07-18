import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_VERSION,
  acceptAll,
  getConsent,
  hasConsentDecision,
  hasMarketingConsent,
  isConsentRequiredTimeZone,
  rejectAll,
  setConsent,
} from './consent';

const KEY = 'fyredocs:cookieConsent';

/** Force the browser timezone the region default reads from. */
function mockTimeZone(tz: string) {
  vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone: tz }),
  } as unknown as Intl.DateTimeFormat);
}

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('consent store', () => {
  it('has no explicit decision by default', () => {
    expect(hasConsentDecision()).toBe(false);
  });

  it('acceptAll grants analytics + marketing', () => {
    acceptAll();
    expect(hasConsentDecision()).toBe(true);
    expect(hasMarketingConsent()).toBe(true);
    expect(getConsent()?.categories.analytics).toBe(true);
  });

  it('rejectAll records a decision but keeps non-essential off (any region)', () => {
    mockTimeZone('Asia/Kolkata'); // even in an opt-out region, an explicit reject wins
    rejectAll();
    expect(hasConsentDecision()).toBe(true);
    expect(hasMarketingConsent()).toBe(false);
  });

  it('setConsent always forces necessary on', () => {
    setConsent({ analytics: false, marketing: true });
    expect(getConsent()?.categories.necessary).toBe(true);
    expect(hasMarketingConsent()).toBe(true);
  });

  it('re-asks (returns null) when the stored version is stale', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        categories: { necessary: true, analytics: true, marketing: true },
        version: CONSENT_VERSION - 1,
        ts: Date.now(),
      })
    );
    expect(getConsent()).toBeNull();
    expect(hasConsentDecision()).toBe(false);
  });

  it('tolerates corrupt storage', () => {
    window.localStorage.setItem(KEY, 'not-json');
    expect(getConsent()).toBeNull();
  });

  it('dispatches a change event when a choice is saved', () => {
    let fired = false;
    const handler = () => {
      fired = true;
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, handler);
    acceptAll();
    window.removeEventListener(CONSENT_CHANGE_EVENT, handler);
    expect(fired).toBe(true);
  });
});

describe('region-aware default (no stored choice)', () => {
  it('defaults marketing ON outside the EU/EEA/UK (opt-out)', () => {
    mockTimeZone('Asia/Kolkata');
    expect(hasConsentDecision()).toBe(false);
    expect(hasMarketingConsent()).toBe(true);
  });

  it('defaults marketing OFF inside the EU/EEA/UK (opt-in)', () => {
    mockTimeZone('Europe/Berlin');
    expect(hasConsentDecision()).toBe(false);
    expect(hasMarketingConsent()).toBe(false);
  });
});

describe('isConsentRequiredTimeZone', () => {
  it('flags EU/EEA/UK + EU territories + unknown as consent-required', () => {
    for (const tz of [
      'Europe/Berlin',
      'Europe/London',
      'Europe/Paris',
      'Europe/Dublin',
      'Asia/Nicosia',
      'Asia/Famagusta',
      'Atlantic/Canary',
      'Atlantic/Madeira',
      'Atlantic/Azores',
      '',
    ]) {
      expect(isConsentRequiredTimeZone(tz)).toBe(true);
    }
  });

  it('treats non-EU zones as opt-out (default ON)', () => {
    for (const tz of ['Asia/Kolkata', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney', 'Africa/Lagos']) {
      expect(isConsentRequiredTimeZone(tz)).toBe(false);
    }
  });
});
