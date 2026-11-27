import { useEffect, useRef, useState } from 'react';
import { createNonce, googleClientId, loadGoogleIdentity } from './googleIdentity';

/**
 * Google's own "Continue with Google" button (Google Identity Services), drawn by Google inside
 * the container. Calls onCredential with the ID token and the raw nonce. Calls onUnavailable
 * when Google's script can't be loaded, so the page can fall back to the redirect sign-in.
 */
export default function GoogleButton({
  onCredential,
  onUnavailable,
  disabled,
}: {
  onCredential: (idToken: string, nonce: string) => void;
  onUnavailable: () => void;
  disabled?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // Latest callbacks, without setting Google up again on every render.
  const handlers = useRef({ onCredential, onUnavailable });
  useEffect(() => {
    handlers.current = { onCredential, onUnavailable };
  });

  useEffect(() => {
    if (!googleClientId) return;
    const clientId = googleClientId;
    let active = true;
    (async () => {
      try {
        const [google, nonce] = await Promise.all([loadGoogleIdentity(), createNonce()]);
        const el = container.current;
        if (!active || !el) return;
        google.initialize({
          client_id: clientId,
          nonce: nonce.hashed,
          auto_select: false,
          itp_support: true,
          use_fedcm_for_button: true,
          ux_mode: 'popup',
          callback: ({ credential }) => {
            if (credential) handlers.current.onCredential(credential, nonce.raw);
          },
        });
        google.renderButton(el, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: Math.min(400, Math.max(200, Math.floor(el.clientWidth))),
        });
        setReady(true);
      } catch (error) {
        console.warn('Google sign-in button unavailable:', error);
        if (active) handlers.current.onUnavailable();
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="relative mt-6 min-h-[44px]" aria-busy={!ready || undefined}>
      <div
        ref={container}
        className={`flex w-full justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      />
      {!ready && (
        <p className="absolute inset-0 flex items-center justify-center text-small text-muted" role="status">
          Loading Google sign-in…
        </p>
      )}
    </div>
  );
}
