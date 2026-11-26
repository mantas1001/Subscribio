import { Link } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';
import { formatEur, formatShortDate, useStore } from '../../store';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LinkButton from '../../components/ui/LinkButton';
import PageHeader from '../../components/layout/PageHeader';
import { ActionBar, StatusIcon, ToolTile, initials } from './parts';

// Frame 2.1 Pending requests, with frame 2.9 "Nothing pending" as the empty state.
// Approved requests that still need a recorded purchase stay in the list so the CEO can
// come back to them (they open frame 2.4).
// Phone: one card per request (Figma 2.1). Desktop: a table with column headers.

const desktopColumns =
  'lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_20px]';

export default function RequestsPage() {
  const { requests, employees } = useStore();
  const open = requests.filter((r) => r.status === 'pending' || r.status === 'approved');
  const nameOf = (employeeId: string) => employees.find((e) => e.id === employeeId)?.name;

  return (
    <div className="flex flex-col gap-6 px-gutter pt-6 lg:pt-4">
      <PageHeader title="Requests" description="Review what your team needs." />

      {open.length === 0 ? (
        <>
          <EmptyState
            icon={<StatusIcon tone="success" />}
            title="You’re all caught up"
            description="No requests are waiting for review. New ones appear here when a team member sends one."
          />
          <ActionBar aboveTabBar>
            <LinkButton className="w-full" to="/">Back to overview</LinkButton>
          </ActionBar>
        </>
      ) : (
        <div className="lg:overflow-hidden lg:rounded-xl lg:border lg:border-line lg:bg-surface lg:shadow-card">
          {/* Desktop column headers (decorative: every row reads on its own for screen readers). */}
          <div
            aria-hidden="true"
            className={`hidden border-b border-line bg-canvas/60 px-5 py-2.5 text-label font-medium text-muted lg:grid lg:gap-4 ${desktopColumns}`}
          >
            <span>Tool</span>
            <span>Requested by</span>
            <span>Requested</span>
            <span className="text-right">Monthly cost</span>
            <span>Status</span>
            <span />
          </div>
          <ul className="flex flex-col gap-3 lg:gap-0">
            {open.map((r) => {
              const name = nameOf(r.employeeId);
              const to = r.status === 'pending' ? `/requests/${r.id}` : `/requests/${r.id}/purchase`;
              const badge =
                r.status === 'pending' ? (
                  <Badge tone="warn">Pending review</Badge>
                ) : (
                  <Badge tone="success">Approved, record purchase</Badge>
                );
              const requested = r.requestedAt ? `Requested ${formatShortDate(r.requestedAt)}` : 'Requested';
              return (
                <li key={r.id} className="lg:border-b lg:border-line lg:last:border-b-0">
                  <Link
                    to={to}
                    className="group block rounded-xl border border-line bg-surface p-4 shadow-card transition-[border-color,box-shadow,background-color] duration-150 hover:border-line-strong hover:shadow-raised lg:rounded-none lg:border-0 lg:px-5 lg:py-3.5 lg:shadow-none lg:hover:bg-canvas lg:hover:shadow-none"
                  >
                    {/* Phone card */}
                    <span className="flex flex-col gap-3 lg:hidden">
                      <span className="flex items-center gap-3">
                        <ToolTile tool={r.tool} />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-base font-semibold text-brand-ink">{r.tool}</span>
                          <span className="truncate text-small text-muted">{name}</span>
                        </span>
                        <span className="flex flex-col items-end">
                          <span className="text-base font-semibold text-brand-ink">{formatEur(r.monthlyCostEur)}</span>
                          <span className="text-caption text-muted">/month</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-[9px] font-semibold text-brand"
                        >
                          {initials(name)}
                        </span>
                        <span className="flex-1 text-caption text-muted">{requested}</span>
                        {badge}
                        <CaretRight size={16} aria-hidden="true" className="text-faint" />
                      </span>
                    </span>

                    {/* Desktop row */}
                    <span className={`hidden items-center lg:grid lg:gap-4 ${desktopColumns}`}>
                      <span className="flex min-w-0 items-center gap-3">
                        <ToolTile tool={r.tool} size="sm" />
                        <span className="truncate text-small font-semibold text-brand-ink">{r.tool}</span>
                      </span>
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[9px] font-semibold text-brand"
                        >
                          {initials(name)}
                        </span>
                        <span className="truncate text-small text-brand-ink">{name}</span>
                      </span>
                      <span className="text-small text-muted">
                        {r.requestedAt ? formatShortDate(r.requestedAt) : 'Not recorded'}
                      </span>
                      <span className="text-right text-small font-semibold text-brand-ink">
                        {`${formatEur(r.monthlyCostEur)}/mo`}
                      </span>
                      <span>{badge}</span>
                      <CaretRight
                        size={16}
                        aria-hidden="true"
                        className="text-faint transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-brand-ink"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
