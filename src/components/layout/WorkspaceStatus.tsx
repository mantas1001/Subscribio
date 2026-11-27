import { useEffect } from 'react';
import Button from '../ui/Button';
import ErrorMessage from '../ui/ErrorMessage';
import { Logo } from './AppShell';
import { useAuth } from '../../auth/AuthProvider';

/** Full-screen state while the shared workspace loads, fails to load, or the user is blocked. */
export default function WorkspaceStatus({
  phase,
  onRetry,
}: {
  phase: 'loading' | 'error' | 'blocked';
  onRetry: () => void;
}) {
  const { signOut } = useAuth();

  useEffect(() => {
    document.title = phase === 'blocked' ? 'No access · Subscribio' : 'Subscribio';
  }, [phase]);

  if (phase === 'loading') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas" aria-busy="true">
        <p className="text-small text-muted" role="status">
          Loading your workspace…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas px-gutter py-12">
      <main className="w-full max-w-[420px]">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-raised sm:p-8">
          {phase === 'blocked' ? (
            <>
              <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-brand-ink">
                You don’t have access
              </h1>
              <p className="mt-2 text-body text-muted">
                An admin removed your access to this Subscribio workspace. Ask them to restore it,
                or sign in with a different Google account.
              </p>
              <Button variant="secondary" className="mt-6 w-full" onClick={signOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-brand-ink">
                Couldn’t load the workspace
              </h1>
              <ErrorMessage
                className="mt-4"
                title="Connection problem"
                message="Subscribio couldn’t reach its database. Check your connection and try again."
              />
              <div className="mt-6 flex flex-col gap-2">
                <Button className="w-full" onClick={onRetry}>
                  Try again
                </Button>
                <Button variant="secondary" className="w-full" onClick={signOut}>
                  Sign out
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
