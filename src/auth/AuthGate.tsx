import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import SignInPage from './SignInPage';

/**
 * Shows the app only to signed-in users. Signed-out visitors see the sign-in screen at the
 * address they opened, so after signing in they land on that page (deep links keep working).
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas" aria-busy="true">
        <p className="text-small text-muted" role="status">
          Checking your sign-in…
        </p>
      </div>
    );
  }
  if (status === 'signed-out' || status === 'misconfigured') return <SignInPage />;
  return <>{children}</>;
}
