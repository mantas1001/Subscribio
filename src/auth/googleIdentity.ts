// Google Identity Services ("Sign in with Google" button), used when VITE_GOOGLE_CLIENT_ID is set.
//
// Why: with the redirect flow, Google's consent screen names the address it sends people back to,
// which is the Supabase project (xxxx.supabase.co). With this button the user signs in with Google
// in a popup on the app's own address, so Google names subscribio.vercel.app (or "Subscribio"
// once the Google brand is verified). Google returns an ID token, which Supabase turns into a
// session (supabase.auth.signInWithIdToken).

/** OAuth Web client ID from Google Cloud → Google Auth Platform → Clients. Public. */
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || null;

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

type CredentialResponse = { credential?: string };

export type GoogleId = {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    nonce?: string;
    auto_select?: boolean;
    itp_support?: boolean;
    use_fedcm_for_button?: boolean;
    ux_mode?: 'popup' | 'redirect';
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

let loading: Promise<GoogleId> | null = null;

/** Loads Google's script once. Rejects if it can't be loaded (offline, blocked) within 10 s. */
export function loadGoogleIdentity(): Promise<GoogleId> {
  const existing = window.google?.accounts?.id;
  if (existing) return Promise.resolve(existing);
  loading ??= new Promise<GoogleId>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    const fail = (error: Error) => {
      window.clearTimeout(timer);
      loading = null;
      script.remove();
      reject(error);
    };
    const timer = window.setTimeout(() => fail(new Error('Google sign-in timed out')), 10_000);
    script.onload = () => {
      window.clearTimeout(timer);
      const id = window.google?.accounts?.id;
      if (id) resolve(id);
      else fail(new Error('Google sign-in script loaded without accounts.id'));
    };
    script.onerror = () => fail(new Error('Google sign-in script failed to load'));
    document.head.appendChild(script);
  });
  return loading;
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * A fresh nonce: Google puts the SHA-256 hash in the ID token and Supabase checks it against the
 * raw value, so a token can't be replayed from elsewhere.
 */
export async function createNonce() {
  const raw = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return { raw, hashed: toHex(new Uint8Array(digest)) };
}

/** After sign-out: don't sign the same Google account straight back in. */
export function forgetGoogleAccount() {
  window.google?.accounts?.id?.disableAutoSelect();
}
