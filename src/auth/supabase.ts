import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase Auth client for Google sign-in.
//
// The app uses HashRouter (#/employees …), so the OAuth return can't use the URL hash: Supabase
// would put tokens there and the router would read them as a route. We use the PKCE flow
// instead. Supabase sends the user back to the app's base URL with `?code=…` (or `?error=…`)
// in the query string, before the hash, and supabase-js swaps the code for a session.

/** sessionStorage key for the hash route to return to after Google sign-in. */
export const RETURN_TO_KEY = 'subscribio:return-to';

// Read the callback parameters now, before supabase-js starts: it removes `code` from the
// address bar once it has exchanged it, and we still need to know this load was a return
// from Google so we can put the user back on the page they wanted.
function readCallback() {
  const url = new URL(window.location.href);
  const hashParams = url.hash.startsWith('#/') || url.hash === '' ? null : new URLSearchParams(url.hash.slice(1));
  const get = (name: string) => url.searchParams.get(name) ?? hashParams?.get(name) ?? null;
  const error = get('error');
  return {
    isReturn: Boolean(get('code') || error),
    error,
    errorDescription: get('error_description'),
  };
}

export const authCallback = readCallback();

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * How sign-in behaves in this build:
 * - `on`: Supabase is configured; the app requires Google sign-in.
 * - `off`: no sign-in (browser regression tests built with `--mode e2e`, or local dev without
 *   Supabase keys) so the app can be worked on without an account.
 * - `misconfigured`: a production build without Supabase keys. Fails closed: the app shows a
 *   "Sign-in isn't set up" screen instead of opening without sign-in.
 */
export const authMode: 'on' | 'off' | 'misconfigured' =
  import.meta.env.MODE === 'e2e'
    ? 'off'
    : url && key
      ? 'on'
      : import.meta.env.DEV
        ? 'off'
        : 'misconfigured';

export const supabase: SupabaseClient | null =
  authMode === 'on' && url && key
    ? createClient(url, key, {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;
