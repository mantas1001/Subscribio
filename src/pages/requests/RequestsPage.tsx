import { Link } from 'react-router-dom';
import { formatEur, formatShortDate, useStore } from '../../store';
import { ActionBar, LocalBadge, LocalLinkButton, StatusIcon, ToolTile, initials } from './parts';

// Frame 2.1 Pending requests, with frame 2.9 "Nothing pending" as the empty state.
// Approved requests that still need a recorded purchase stay in the list so the CEO can
// come back to them (they open frame 2.4).
export default function RequestsPage() {
  const { requests, employees } = useStore();
  const open = requests.filter((r) => r.status === 'pending' || r.status === 'approved');
  const nameOf = (employeeId: string) => employees.find((e) => e.id === employeeId)?.name;

  return (
    <div className="flex flex-col gap-4 px-gutter pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-semibold text-brand-ink">Requests</h1>
        <p className="text-body text-muted">Review what your team needs.</p>
      </div>

      {open.length === 0 ? (
        <>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-6 py-8 text-center">
            <StatusIcon tone="success" />
            <h2 className="text-section font-semibold text-brand-ink">You’re all caught up</h2>
            <p className="text-small text-muted">
              No requests are waiting for review. New ones appear here when a team member sends
              one.
            </p>
          </div>
          <ActionBar aboveTabBar>
            <LocalLinkButton to="/">Back to overview</LocalLinkButton>
          </ActionBar>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {open.map((r) => {
            const name = nameOf(r.employeeId);
            const to = r.status === 'pending' ? `/requests/${r.id}` : `/requests/${r.id}/purchase`;
            return (
              <li key={r.id}>
                <Link
                  to={to}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
                >
                  <span className="flex items-center gap-3">
                    <ToolTile tool={r.tool} />
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-base font-semibold text-brand-ink">{r.tool}</span>
                      <span className="text-small text-muted">{name}</span>
                    </span>
                    <span className="flex flex-col items-end">
                      <span className="text-base font-semibold text-brand-ink">
                        {formatEur(r.monthlyCostEur)}
                      </span>
                      <span className="text-caption text-muted">/month</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-[9px] font-medium text-brand"
                    >
                      {initials(name)}
                    </span>
                    <span className="flex-1 text-caption text-muted">
                      {r.requestedAt ? `Requested ${formatShortDate(r.requestedAt)}` : 'Requested'}
                    </span>
                    {r.status === 'pending' ? (
                      <LocalBadge tone="pending">Pending review</LocalBadge>
                    ) : (
                      <LocalBadge tone="approved">Approved, record purchase</LocalBadge>
                    )}
                    <span aria-hidden="true" className="text-muted">
                      ›
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
