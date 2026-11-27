// Microsoft Clarity (heatmaps and session recordings).
//
// - Project ID comes from VITE_CLARITY_PROJECT_ID (public; it ends up in the page anyway).
// - Starts automatically on every visit. People are told about it when the link is shared with
//   them (see "Analytics" in the README), so there is no banner to click.
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

let loaded = false;
let identity: { userId: string; role: string | null } | null = null;

/** Call once at start-up: adds Clarity's script (the official snippet). */
export function initClarity() {
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

/** Links this visit's recording to the signed-in member (pseudonymous Supabase user ID + role). */
export function identifyClarity(userId: string, role: string | null) {
  identity = { userId, role };
  applyIdentity();
}

function applyIdentity() {
  if (!loaded || !window.clarity || !identity) return;
  window.clarity('identify', identity.userId);
  window.clarity('set', 'user_id', identity.userId);
  if (identity.role) window.clarity('set', 'role', identity.role);
}
