/**
 * Cookie-consent store (GDPR opt-in). First-party localStorage only — no external
 * scripts, so it runs under the strict Content-Security-Policy.
 *
 * Non-necessary categories default to FALSE until the user opts in. Any script that
 * sets non-essential cookies (future ads / analytics) MUST check these readers, and
 * re-check on the CONSENT_CHANGE_EVENT, BEFORE loading:
 *
 *   import { hasMarketingConsent, CONSENT_CHANGE_EVENT } from '@/lib/consent';
 *   const loadAds = () => { if (hasMarketingConsent()) { ...inject ad script... } };
 *   loadAds();
 *   window.addEventListener(CONSENT_CHANGE_EVENT, loadAds);
 *
 * This pairs with the CSP knob CSP_AD_DOMAINS: the CSP *allows* the ad host, consent
 * *decides* whether it actually loads. Strictly-necessary cookies (the auth
 * access_token / guest_token) are exempt and always on.
 *
 * Regional default (before the user makes an explicit choice): marketing/analytics
 * default ON outside the EU/EEA/UK (opt-out, to fund the service) and OFF inside it
 * (opt-in, as GDPR/UK-PECR require). Region is inferred from the browser timezone —
 * a dependency-free heuristic that also covers guests; it errs toward opt-in when
 * the zone is unknown or European-but-non-EU (the legally safe side). For higher
 * accuracy, add an edge/CDN country header (e.g. Caddy GeoIP or Cloudflare
 * CF-IPCountry) and prefer it in isConsentRequiredRegion(). An explicit user choice
 * always overrides the regional default.
 */

const STORAGE_KEY = 'fyredocs:cookieConsent';

/** Bump when the cookie policy materially changes, to re-prompt everyone. */
export const CONSENT_VERSION = 1;

/** Dispatched on `window` after the user's consent choice changes. */
export const CONSENT_CHANGE_EVENT = 'fyredocs:consent-change';
/** Dispatched to (re)open the preferences UI, e.g. a Footer "Cookie settings" link. */
export const CONSENT_OPEN_EVENT = 'fyredocs:consent-open';

export interface ConsentCategories {
  /** Always true — auth/session cookies are strictly necessary. */
  necessary: true;
  analytics: boolean;
  /** Ads and other marketing cookies. */
  marketing: boolean;
}

export interface StoredConsent {
  categories: ConsentCategories;
  version: number;
  ts: number;
}

/** Non-necessary categories chosen by the user. */
export type ConsentChoice = Omit<ConsentCategories, 'necessary'>;

export const REJECT_ALL: ConsentCategories = { necessary: true, analytics: false, marketing: false };
export const ACCEPT_ALL: ConsentCategories = { necessary: true, analytics: true, marketing: true };

/**
 * EU-territory timezones that are NOT under the `Europe/` prefix (Cyprus, plus the
 * Spanish/Portuguese Atlantic territories). `Europe/*` itself is matched separately.
 */
const CONSENT_REQUIRED_TIMEZONES = new Set([
  'Atlantic/Canary',
  'Atlantic/Madeira',
  'Atlantic/Azores',
  'Asia/Nicosia',
  'Asia/Famagusta',
]);

/**
 * Pure region check: does this IANA timezone fall in a region that requires opt-in
 * consent before ad cookies (EU/EEA/UK + EU territories)? Any `Europe/*` zone counts
 * (a conservative superset — EEA/UK/CH/etc. all have consent laws); unknown/empty
 * timezones return true (safe default = opt-in).
 */
export function isConsentRequiredTimeZone(tz: string): boolean {
  if (!tz) return true;
  if (tz.startsWith('Europe/')) return true;
  return CONSENT_REQUIRED_TIMEZONES.has(tz);
}

/** Reads the browser timezone and applies isConsentRequiredTimeZone. */
export function isConsentRequiredRegion(): boolean {
  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    tz = '';
  }
  return isConsentRequiredTimeZone(tz);
}

/**
 * The categories to assume BEFORE the user makes an explicit choice: opt-out
 * (marketing on) outside the EU/EEA/UK, opt-in (off) inside it.
 */
export function getDefaultCategories(): ConsentCategories {
  const allow = !isConsentRequiredRegion();
  return { necessary: true, analytics: allow, marketing: allow };
}

/**
 * Returns the stored consent, or null when none is saved OR the saved version is
 * older than CONSENT_VERSION (which means we must re-ask).
 */
export function getConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (!parsed || parsed.version !== CONSENT_VERSION || !parsed.categories) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** True once the user has made a choice for the current policy version. */
export function hasConsentDecision(): boolean {
  return getConsent() !== null;
}

/** Persists a choice and notifies listeners. `necessary` is always forced on. */
export function setConsent(choice: ConsentChoice): void {
  const value: StoredConsent = {
    categories: { necessary: true, analytics: !!choice.analytics, marketing: !!choice.marketing },
    version: CONSENT_VERSION,
    ts: Date.now(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore write failures (private mode, storage disabled) — it just won't persist
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: value.categories }));
  } catch {
    // no-op
  }
}

export function acceptAll(): void {
  setConsent({ analytics: true, marketing: true });
}

export function rejectAll(): void {
  setConsent({ analytics: false, marketing: false });
}

/**
 * Current categories: the user's stored choice if any, otherwise the region-aware
 * default (opt-out outside the EU/EEA/UK, opt-in inside it).
 */
export function getCategories(): ConsentCategories {
  return getConsent()?.categories ?? getDefaultCategories();
}

/** Gate reader — safe to call outside React. */
export function hasAnalyticsConsent(): boolean {
  return getCategories().analytics;
}

/** Gate reader for ads/marketing — safe to call outside React. */
export function hasMarketingConsent(): boolean {
  return getCategories().marketing;
}

/** Ask any mounted CookieConsent UI to reopen (e.g. from a Footer link). */
export function openCookiePreferences(): void {
  try {
    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
  } catch {
    // no-op
  }
}
