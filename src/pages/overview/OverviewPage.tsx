import { Link } from 'react-router-dom';
import { formatEur, formatEurShort, formatShortDate, plural, useStore } from '../../store';

// Frame 1.1 Overview. Frames 1.2 (after purchase) and 1.3 (after cancel) are the same
// page: every number below is derived live from the shared store.
export default function OverviewPage() {
  const store = useStore();
  const {
    monthlySpend,
    annualizedSpend,
    activeSubscriptionCount,
    activeSeatCount,
    pendingRequestCount,
    pendingRequestedSpend,
    renewalsWithin30Days,
    employeeCount,
    departmentCount,
    employees,
  } = store;

  const ownerOf = (subscriptionId: string) =>
    employees.find((e) => e.subscriptionIds.includes(subscriptionId))?.name;

  return (
    <div className="flex flex-col gap-4 px-gutter pt-6">
      <p className="text-eyebrow font-medium uppercase text-brand-accent-text">
        Your workspace, in focus
      </p>
      <h1 className="text-title font-semibold text-brand-ink">Subscription overview</h1>
      <p className="text-body text-muted">
        A clear view of your team’s tools, spending, and requests.
      </p>

      <Link
        to="/requests"
        className="flex items-center justify-center rounded-lg bg-brand p-4 text-base font-medium text-surface"
      >
        {pendingRequestCount > 0
          ? `Review ${plural(pendingRequestCount, 'pending request')}`
          : 'See requests'}
        <span aria-hidden="true">&nbsp;&nbsp;→</span>
      </Link>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5 rounded-xl border border-brand bg-brand p-4">
          <p className="text-small text-brand-on-dark">Monthly spend</p>
          <p className="flex items-end gap-1.5">
            <span className="text-title font-medium text-surface">{formatEur(monthlySpend)}</span>
            <span className="text-small text-brand-on-dark">/mo</span>
          </p>
          <p className="text-caption text-brand-on-dark">{formatEur(annualizedSpend)} annualized</p>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 rounded-xl border border-line bg-surface p-4">
          <p className="text-small text-muted">Active subscriptions</p>
          <p className="flex items-end gap-1.5">
            <span className="text-title font-medium text-brand-ink">{activeSeatCount}</span>
            <span className="text-small text-muted">{activeSeatCount === 1 ? 'seat' : 'seats'}</span>
          </p>
          <p className="text-caption text-muted">
            {plural(activeSubscriptionCount, 'tool')} across your company
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          to="/employees"
          className="flex flex-1 flex-col gap-1.5 rounded-xl border border-line bg-surface p-4"
        >
          <span className="text-small text-muted">Team members</span>
          <span className="flex items-end gap-1.5">
            <span className="text-title font-medium text-brand-ink">{employeeCount}</span>
            <span className="text-small text-muted">{employeeCount === 1 ? 'person' : 'people'}</span>
          </span>
          <span className="text-caption text-muted">In {plural(departmentCount, 'department')}</span>
        </Link>
        <Link
          to="/requests"
          className="flex flex-1 flex-col gap-1.5 rounded-xl border border-warn-line bg-warn-bg p-4"
        >
          <span className="text-small text-muted">Pending requests</span>
          <span className="flex items-end gap-1.5">
            <span className="text-title font-medium text-brand-ink">{pendingRequestCount}</span>
            <span className="text-small text-muted">to review</span>
          </span>
          <span className="text-caption text-warn-ink">
            {pendingRequestCount > 0
              ? `${formatEurShort(pendingRequestedSpend)}/mo requested`
              : 'Nothing waiting'}
            <span aria-hidden="true">&nbsp;&nbsp;→</span>
          </span>
        </Link>
      </div>

      <div className="rounded-lg border border-line bg-brand-soft px-4 py-3.5">
        <p className="text-body font-medium text-brand">
          Approve a request, buy the tool, then record the purchase here so your spend stays
          accurate.
        </p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="renewals-heading">
        <div className="flex items-center gap-2">
          <h2 id="renewals-heading" className="text-section font-semibold text-brand-ink">
            Upcoming renewals
          </h2>
          <span className="flex-1" />
          <span className="text-caption text-muted">Next 30 days</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {renewalsWithin30Days.length === 0 ? (
            <p className="px-4 py-3.5 text-small text-muted">No renewals in the next 30 days.</p>
          ) : (
            <ul>
              {renewalsWithin30Days.map((s) => (
                <li key={s.id} className="border-b border-line last:border-b-0">
                  <Link to={`/subscriptions/${s.id}`} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      aria-hidden="true"
                      className="flex size-10 items-center justify-center rounded-md border border-line bg-brand-soft text-[17px] font-semibold text-brand"
                    >
                      {s.tool.charAt(0)}
                    </span>
                    <span className="flex flex-1 flex-col gap-0.5">
                      <span className="text-base font-medium text-brand-ink">{s.tool}</span>
                      <span className="text-caption text-muted">{ownerOf(s.id) ?? 'Company'}</span>
                    </span>
                    <span className="flex flex-col items-end gap-0.5">
                      <span className="text-base font-medium text-brand-ink">
                        {formatEurShort(s.monthlyCostEur)}
                      </span>
                      <span className="text-caption text-muted">{formatShortDate(s.renewalDate)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={() => {
          if (window.confirm('Reset all example data to the starting state?')) store.resetExampleData();
        }}
        className="self-center rounded-sm px-2 py-1 text-caption text-muted underline underline-offset-2"
      >
        Reset example data
      </button>
    </div>
  );
}
