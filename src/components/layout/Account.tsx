import { useState } from 'react';
import { SignOut } from '@phosphor-icons/react';
import { accountDisplay, useAuth } from '../../auth/AuthProvider';

function Avatar({ name, avatarUrl, initial }: { name: string; avatarUrl?: string; initial: string }) {
  const [failed, setFailed] = useState(false);
  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        width={32}
        height={32}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="size-8 shrink-0 rounded-full border border-line object-cover"
        title={name}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-small font-semibold text-brand"
    >
      {initial}
    </span>
  );
}

/** Desktop sidebar: who is signed in, and "Sign out". Renders nothing when sign-in is off. */
export function SidebarAccount() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const account = accountDisplay(user);
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5">
      <Avatar {...account} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium text-brand-ink">{account.name}</p>
        {account.email && account.email !== account.name && (
          <p className="truncate text-caption text-muted">{account.email}</p>
        )}
      </div>
      <button
        type="button"
        onClick={signOut}
        className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition-[background-color,color] duration-150 hover:bg-canvas hover:text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-label="Sign out"
        title="Sign out"
      >
        <SignOut size={20} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Phone header: avatar plus a "Sign out" button. Renders nothing when sign-in is off. */
export function HeaderAccount() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <button
      type="button"
      onClick={signOut}
      className="flex min-h-11 items-center gap-1.5 rounded-md px-1.5 text-small font-medium text-muted hover:text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      aria-label="Sign out"
    >
      <SignOut size={20} aria-hidden="true" />
      <span>Sign out</span>
    </button>
  );
}
