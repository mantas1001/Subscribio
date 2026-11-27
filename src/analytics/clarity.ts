// Microsoft Clarity (heatmaps and session recordings), loaded only after the visitor allows it.
//
// - Project ID comes from VITE_CLARITY_PROJECT_ID (public; it ends up in the page anyway).
// - Nothing is loaded until the visitor clicks "Allow" on the consent banner. The choice is kept
//   in localStorage and can be changed from "Analytics settings".
// - Signed-in people are linked by their Supabase user ID plus their role. No name or email is sent.

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

const PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

/** False in the regression-test build and when no project ID is configured. */
export const clarityAvailable = Boolean(PROJECT_ID) && import.meta.env.MODE !== 'e2e';

export const CONSENT_KEY = 'subscribio:analytics-consent';
export type Consent = 'granted' | 'denied';

export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

let loaded = false;
let identity: { userId: string; role: string | null } | null = null;

/** Adds Clarity's script (the official snippet) and tells it analytics storage is allowed. */
function load() {
  if (loaded || !clarityAvailable || !PROJECT_ID) return;
  loaded = true;
  const queue: ClarityFn =
    window.clarity ??
    Object.assign(
      (...args: unknown[]) => {
        (queue.q = queue.q ?? []).push(args);
      },
      { q: [] as unknown[][] },
    );
  window.clarity = queue;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(PROJECT_ID)}`;
  document.head.appendChild(script);
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  applyIdentity();
}

/** Call once at start-up: loads Clarity if the visitor already allowed it on an earlier visit. */
export function initClarity() {
  if (readConsent() === 'granted') load();
}

/** Saves the visitor's choice. Allowing loads Clarity now; declining after allowing reloads the page to unload it. */
export function setConsent(consent: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // storage blocked: the choice applies to this visit only
  }
  if (consent === 'granted') {
    load();
  } else if (loaded) {
    window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
    window.clarity?.('consent', false);
    window.location.reload();
  }
}

/** Forget the choice so the banner asks again. */
export function resetConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('subscribio:analytics-consent'));
}

/** Links this visit's recording to the signed-in member (pseudonymous Supabase user ID + role). */
export function identifyClarity(userId: string, role: string | null) {
  identity = { userId, role };
  applyIdentity();
}

/** Sends the remembered identity once Clarity is loaded (also when consent comes later). */
function applyIdentity() {
  if (!loaded || !window.clarity || !identity) return;
  window.clarity('identify', identity.userId);
  window.clarity('set', 'user_id', identity.userId);
  if (identity.role) window.clarity('set', 'role', identity.role);
}
