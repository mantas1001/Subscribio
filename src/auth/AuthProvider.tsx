import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authCallback, authMode, RETURN_TO_KEY, supabase } from './supabase';

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out' | 'disabled' | 'misconfigured';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  /** Message to show on the sign-in screen (cancelled, failed), or null. */
  error: string | null;
  /** True from the click on "Continue with Google" until the browser leaves for Google. */
  redirecting: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Current hash route, e.g. "/employees/e2". Falls back to "/". */
function currentRoute() {
  const route = window.location.hash.replace(/^#/, '');
  return route.startsWith('/') && !route.startsWith('//') ? route : '/';
}

/** Message for an `?error=` that Supabase or Google sent back. */
function callbackErrorMessage(error: string) {
  return error === 'access_denied'
    ? 'Sign-in was cancelled. You can try again whenever you’re ready.'
    : 'Google sign-in didn’t work. Please try again.';
}

/**
 * After a return from Google: remove `?code=` / `?error=` from the address bar and put the user
 * back on the route they were on when they clicked "Continue with Google".
 */
function restoreRouteAfterReturn() {
  const saved = sessionStorage.getItem(RETURN_TO_KEY);
  sessionStorage.removeItem(RETURN_TO_KEY);
  const route = saved && saved.startsWith('/') && !saved.startsWith('//') ? saved : '/';
  window.history.replaceState(null, '', `${window.location.pathname}#${route}`);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;

    // Keep the session in sync (sign-out in another tab, token refresh, expiry).
    // Only set state here: awaiting other Supabase calls inside this callback can deadlock.
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });

    (async () => {
      // initialize() resolves once supabase-js has handled any `?code=` from Google.
      const { error: initError } = await client.auth.initialize();
      const { data: current } = await client.auth.getSession();
      if (!active) return;
      if (authCallback.isReturn) {
        restoreRouteAfterReturn();
        if (authCallback.error) {
          if (authCallback.errorDescription) console.warn('Sign-in error:', authCallback.errorDescription);
          setError(callbackErrorMessage(authCallback.error));
        } else if (initError || !current.session) {
          if (initError) console.warn('Sign-in error:', initError.message);
          setError('We couldn’t finish signing you in. Please try again.');
        }
      }
      setSession(current.session);
      setReady(true);
    })();

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Back button from Google's page restores this page from the back/forward cache with the
  // button still saying "Opening Google…". Reset it so the user can try again.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    setRedirecting(true);
    sessionStorage.setItem(RETURN_TO_KEY, currentRoute());
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Base URL of the app without the hash (works on localhost, previews and production).
        // It must be listed under Supabase → Authentication → URL Configuration → Redirect URLs.
        redirectTo: `${window.location.origin}${window.location.pathname}`,
        // Always show Google's account chooser, so switching accounts after sign-out works.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (signInError) {
      console.warn('Sign-in error:', signInError.message);
      sessionStorage.removeItem(RETURN_TO_KEY);
      setRedirecting(false);
      setError('Couldn’t reach Google sign-in. Check your connection and try again.');
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    // 'local': sign out on this browser only, not on the user's other devices.
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) console.warn('Sign-out error:', signOutError.message);
    setError(null);
    setSession(null);
    // Start the next sign-in from the Overview, not from the last page of the previous user.
    window.history.replaceState(null, '', `${window.location.pathname}#/`);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const status: AuthStatus =
      authMode === 'off'
        ? 'disabled'
        : authMode === 'misconfigured'
          ? 'misconfigured'
          : !ready
            ? 'loading'
            : session
              ? 'signed-in'
              : 'signed-out';
    return { status, user: session?.user ?? null, error, redirecting, signInWithGoogle, signOut };
  }, [ready, session, error, redirecting, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

/** Display name and avatar for the signed-in Google account. */
export function accountDisplay(user: User) {
  const meta = user.user_metadata ?? {};
  const name: string = meta.full_name || meta.name || user.email || 'Signed in';
  const avatarUrl: string | undefined = meta.avatar_url || meta.picture || undefined;
  return { name, email: user.email ?? '', avatarUrl, initial: name.trim().charAt(0).toUpperCase() || '?' };
}
