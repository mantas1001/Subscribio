import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ClockCounterClockwise, ShieldCheck } from '@phosphor-icons/react';
import { useStore } from '../../store';
import { fetchActivity, type ActivityEntry } from '../../store/remote';
import { supabase } from '../../auth/supabase';
import PageHeader from '../../components/layout/PageHeader';
import LinkButton from '../../components/ui/LinkButton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorMessage from '../../components/ui/ErrorMessage';

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** "just now", "5 min ago", "3 h ago", else "27 Nov, 14:02". */
function when(iso: string, now: number) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  return timeFormat.format(new Date(iso));
}

/** Activity log: who changed what in the shared workspace, newest first. All members can see it. */
export default function ActivityPage() {
  const { mode, isAdmin, activityVersion } = useStore();
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    fetchActivity(supabase)
      .then((rows) => {
        if (!active) return;
        setEntries(rows);
        setError(null);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [activityVersion]);

  // The log only exists for the shared workspace.
  if (mode !== 'shared') return <Navigate to="/" replace />;

  const now = Date.now();

  return (
    <div className="flex flex-col gap-6 px-gutter pt-6 lg:pt-4">
      <PageHeader
        title="Activity"
        description="Who changed what in this workspace, newest first. Updates live."
        actions={
          isAdmin ? (
            <LinkButton to="/team-access" variant="secondary">
              <ShieldCheck size={18} aria-hidden="true" />
              Team access
            </LinkButton>
          ) : undefined
        }
      />

      {error && <ErrorMessage title="Couldn’t load the activity log" message={error} />}

      {!error && entries === null && (
        <p className="text-small text-muted" role="status">
          Loading activity…
        </p>
      )}

      {entries && entries.length === 0 && (
        <EmptyState
          icon={<ClockCounterClockwise size={28} aria-hidden="true" />}
          title="No activity yet"
          description="Approvals, purchases, cancellations and new team members will show up here."
        />
      )}

      {entries && entries.length > 0 && (
        <ol className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
          {entries.map((entry) => {
            const who = entry.actor_name || entry.actor_email || 'Someone';
            return (
              <li
                key={entry.id}
                className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0 lg:px-5"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-small font-semibold text-brand"
                >
                  {who.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-small text-brand-ink">
                    <span className="font-semibold">{who}</span> {lowerFirst(entry.summary)}
                  </p>
                  {entry.actor_email && entry.actor_email !== who && (
                    <p className="truncate text-caption text-muted">{entry.actor_email}</p>
                  )}
                </div>
                <time
                  dateTime={entry.at}
                  title={new Date(entry.at).toLocaleString('en-GB')}
                  className="shrink-0 text-caption text-muted"
                >
                  {when(entry.at, now)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
