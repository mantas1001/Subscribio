import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../store';
import { callAction, fetchMembers, type Member } from '../../store/remote';
import { supabase } from '../../auth/supabase';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Team access (admins only): everyone who has signed in. Admins can make someone an admin,
 * remove admin rights, remove someone's access or restore it. Every change is in the activity log.
 */
export default function TeamAccessPage() {
  const { mode, isAdmin, member: me, activityVersion } = useStore();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    try {
      setMembers(await fetchMembers(supabase));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, activityVersion]);

  if (mode !== 'shared' || !isAdmin) return <Navigate to="/" replace />;

  const change = async (target: Member, fn: 'set_member_role' | 'set_member_blocked', args: object) => {
    if (!supabase) return;
    setBusy(target.user_id);
    try {
      await callAction(supabase, fn, { p_user_id: target.user_id, ...args });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-gutter pt-6 lg:pt-4">
      <PageHeader
        title="Team access"
        description="Everyone who has signed in with Google. Anyone with a Google account can join; remove access for people who shouldn’t be here."
      />

      {error && <ErrorMessage title="Something went wrong" message={error} />}

      {members === null && !error && (
        <p className="text-small text-muted" role="status">
          Loading members…
        </p>
      )}

      {members && (
        <ul className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          {members.map((m) => {
            const isMe = m.user_id === me?.user_id;
            const label = m.name || m.email;
            return (
              <li
                key={m.user_id}
                className="flex flex-col gap-3 border-b border-line px-4 py-4 last:border-b-0 lg:flex-row lg:items-center lg:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-small font-semibold text-brand-ink">
                    <span className="truncate">{label}</span>
                    {isMe && <Badge>You</Badge>}
                    {m.role === 'admin' && <Badge tone="brand">Admin</Badge>}
                    {m.blocked && <Badge tone="danger">No access</Badge>}
                  </p>
                  {m.name && <p className="truncate text-caption text-muted">{m.email}</p>}
                  <p className="break-all text-caption text-muted">User ID (Clarity): {m.user_id}</p>
                  <p className="text-caption text-muted">
                    Joined {dateFormat.format(new Date(m.first_seen))} · last seen{' '}
                    {dateFormat.format(new Date(m.last_seen))}
                  </p>
                </div>
                {!isMe && (
                  <div className="flex flex-wrap gap-2">
                    {!m.blocked && (
                      <Button
                        variant="secondary"
                        disabled={busy === m.user_id}
                        onClick={() =>
                          change(m, 'set_member_role', { p_role: m.role === 'admin' ? 'member' : 'admin' })
                        }
                        aria-label={`${m.role === 'admin' ? 'Remove admin rights from' : 'Make admin:'} ${label}`}
                      >
                        {m.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      </Button>
                    )}
                    <Button
                      variant={m.blocked ? 'secondary' : 'danger-outline'}
                      disabled={busy === m.user_id}
                      onClick={() => change(m, 'set_member_blocked', { p_blocked: !m.blocked })}
                      aria-label={`${m.blocked ? 'Restore access for' : 'Remove access for'} ${label}`}
                    >
                      {m.blocked ? 'Restore access' : 'Remove access'}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
