import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CaretRight,
  ClipboardText,
  Info,
  Plus,
  Sparkle,
  Stack,
  UserPlus,
  UsersThree,
  Wallet,
  type Icon,
} from '@phosphor-icons/react';
import { formatEur, formatEurShort, formatShortDate, plural, useStore } from '../../store';
import { Sheet, ToolTile } from '../requests/parts';
import Button from '../../components/ui/Button';
import LinkButton from '../../components/ui/LinkButton';
import PageHeader from '../../components/layout/PageHeader';
import { clarityAvailable, resetConsent } from '../../analytics/clarity';

// Overview (Figma 1.1, with 1.2 after a purchase and 1.3 after a cancel). Every number is
// derived live from the shared store. Premium layout: page header with actions, an alert strip
// for pending approvals, four KPI cards, "Spend by tool" (from the real subscriptions) and
// upcoming renewals.
export default function OverviewPage() {
  const store = useStore();
  const [resetOpen, setResetOpen] = useState(false);
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
    subscriptions,
  } = store;

  const ownerOf = (subscriptionId: string) =>
    employees.find((e) => e.subscriptionIds.includes(subscriptionId))?.name;

  const isEmpty =
    employees.length === 0 && subscriptions.length === 0 && store.requests.length === 0;

  const spendByTool = subscriptions
    .filter((s) => s.status === 'active')
    .sort((a, b) => b.monthlyCostEur - a.monthlyCostEur);

  return (
    <div className="flex flex-col gap-6 px-gutter pt-6 lg:gap-7 lg:pt-4">
      <PageHeader
        title="Subscription overview"
        description="A clear view of your team’s tools, spending, and requests."
        actionsDesktopOnly
        actions={
          <>
            <LinkButton to="/add-employee" variant="secondary">
              <UserPlus size={18} aria-hidden="true" />
              Add employee
            </LinkButton>
            <LinkButton to="/add-subscription">
              <Plus size={18} weight="bold" aria-hidden="true" />
              Add subscription
            </LinkButton>
          </>
        }
      />

      {/* Empty workspace (after "Reset to zero"): explain the next step instead of a page of zeros. */}
      {isEmpty && (
        <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center lg:p-6">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
          >
            <Sparkle size={22} weight="fill" />
          </span>
          <div className="min-w-0 sm:flex-1">
            <h2 className="text-section font-semibold text-brand-ink">Your workspace is empty</h2>
            <p className="mt-1 text-small text-muted">
              Add your first team member and the tools they use. Or load the example data to explore
              every flow.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <LinkButton to="/add-employee" className="w-full sm:w-auto">
              <UserPlus size={18} aria-hidden="true" />
              Add your first employee
            </LinkButton>
            {store.isAdmin && (
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => store.loadExampleData()}>
                Load example data
              </Button>
            )}
          </div>
        </div>
      )}

      {pendingRequestCount > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-warn-line bg-warn-bg p-4 sm:flex-row sm:items-center lg:px-5">
          <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-warn-line bg-surface text-warn-ink"
            >
              <ClipboardText size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-brand-ink">
                {plural(pendingRequestCount, 'tool request')} waiting for your approval
              </p>
              <p className="text-small text-warn-ink">
                {formatEurShort(pendingRequestedSpend)} a month if you approve{' '}
                {pendingRequestCount === 1 ? 'it' : 'them all'}
              </p>
            </div>
          </div>
          <LinkButton to="/requests" className="w-full sm:w-auto">
            Review {plural(pendingRequestCount, 'pending request')}
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </LinkButton>
        </div>
      )}

      {/* KPIs. Phone: 2 x 2 (Figma 1.1). Desktop: one row of four. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          tone="brand"
          icon={Wallet}
          label="Monthly spend"
          value={formatEur(monthlySpend)}
          unit="/mo"
          footnote={`${formatEur(annualizedSpend)} annualized`}
        />
        <MetricCard
          icon={Stack}
          label="Active subscriptions"
          value={String(activeSeatCount)}
          unit={activeSeatCount === 1 ? 'seat' : 'seats'}
          footnote={`${plural(activeSubscriptionCount, 'tool')} across your company`}
        />
        <MetricCard
          to="/employees"
          icon={UsersThree}
          label="Team members"
          value={String(employeeCount)}
          unit={employeeCount === 1 ? 'person' : 'people'}
          footnote={`In ${plural(departmentCount, 'department')}`}
        />
        <MetricCard
          to="/requests"
          tone="warn"
          icon={ClipboardText}
          label="Pending requests"
          value={String(pendingRequestCount)}
          unit="to review"
          footnote={
            pendingRequestCount > 0
              ? `${formatEurShort(pendingRequestedSpend)}/mo requested`
              : 'Nothing waiting'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Spend by tool */}
        <section
          aria-labelledby="spend-heading"
          className="overflow-hidden rounded-xl border border-line bg-surface shadow-card lg:col-span-2"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3.5 lg:px-5">
            <h2 id="spend-heading" className="text-section font-semibold text-brand-ink">
              Spend by tool
            </h2>
            <span className="text-caption text-muted">
              {plural(activeSubscriptionCount, 'active tool')}
            </span>
          </div>
          {spendByTool.length === 0 ? (
            <div className="px-4 py-8 text-center lg:px-5">
              <p className="text-small font-medium text-brand-ink">No active subscriptions</p>
              <p className="mt-1 text-small text-muted">
                Record a purchase or add a subscription to see where the money goes.
              </p>
            </div>
          ) : (
            <ul>
              {spendByTool.map((s) => {
                const share = monthlySpend > 0 ? s.monthlyCostEur / monthlySpend : 0;
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 lg:gap-4 lg:px-5"
                  >
                    <ToolTile tool={s.tool} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-small font-semibold text-brand-ink">
                          {s.tool}
                          {s.plan ? <span className="font-normal text-muted"> · {s.plan}</span> : null}
                        </span>
                        <span className="shrink-0 text-small font-semibold text-brand-ink">
                          {`${formatEur(s.monthlyCostEur)}/mo`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas"
                          role="img"
                          aria-label={`${Math.round(share * 100)}% of monthly spend`}
                        >
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${Math.max(share * 100, 2)}%` }}
                          />
                        </div>
                        <span className="w-[88px] shrink-0 truncate text-right text-caption text-muted lg:w-[120px]">
                          {ownerOf(s.id) ?? 'Company'}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          {/* Upcoming renewals */}
          <section
            aria-labelledby="renewals-heading"
            className="overflow-hidden rounded-xl border border-line bg-surface shadow-card"
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3.5 lg:px-5">
              <h2 id="renewals-heading" className="text-section font-semibold text-brand-ink">
                Upcoming renewals
              </h2>
              <span className="text-caption text-muted">Next 30 days</span>
            </div>
            {renewalsWithin30Days.length === 0 ? (
              <p className="px-4 py-6 text-center text-small text-muted lg:px-5">
                No renewals in the next 30 days.
              </p>
            ) : (
              <ul>
                {renewalsWithin30Days.map((s) => (
                  <li key={s.id} className="border-b border-line last:border-b-0">
                    <Link
                      to={`/subscriptions/${s.id}`}
                      className="group flex items-center gap-3 px-4 py-3 transition-[background-color] duration-150 hover:bg-canvas lg:px-5"
                    >
                      <ToolTile tool={s.tool} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-small font-semibold text-brand-ink">{s.tool}</span>
                        <span className="truncate text-caption text-muted">{ownerOf(s.id) ?? 'Company'}</span>
                      </span>
                      <span className="flex flex-col items-end gap-0.5">
                        <span className="text-small font-semibold text-brand-ink">
                          {formatEurShort(s.monthlyCostEur)}
                        </span>
                        <span className="text-caption text-muted">{formatShortDate(s.renewalDate)}</span>
                      </span>
                      <CaretRight
                        size={16}
                        aria-hidden="true"
                        className="text-faint transition-[color,transform] duration-150 group-hover:translate-x-0.5 group-hover:text-brand-ink"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex gap-3 rounded-xl border border-brand/10 bg-brand-soft p-4">
            <Info size={20} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
            <p className="text-small font-medium text-brand">
              Approve a request, buy the tool, then record the purchase here so your spend stays
              accurate.
            </p>
          </div>
        </div>
      </div>

      {/* Phone: the page actions sit below the content (desktop shows them in the header). */}
      <div className="flex flex-col gap-3 lg:hidden">
        <LinkButton to="/add-subscription" variant="secondary" className="w-full">
          <Plus size={18} weight="bold" aria-hidden="true" />
          Add subscription
        </LinkButton>
        <LinkButton to="/add-employee" variant="secondary" className="w-full">
          <UserPlus size={18} aria-hidden="true" />
          Add employee
        </LinkButton>
      </div>

      {/* Shared workspace: only admins may wipe everyone's data. */}
      {!isEmpty && store.isAdmin && (
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="self-center rounded-sm px-2 py-1 text-caption text-muted underline underline-offset-2 transition-[color] duration-150 hover:text-brand-ink lg:self-start"
        >
          Reset example data
        </button>
      )}

      {clarityAvailable && (
        <button
          type="button"
          onClick={resetConsent}
          className="self-center rounded-sm px-2 py-1 text-caption text-muted underline underline-offset-2 transition-[color] duration-150 hover:text-brand-ink lg:self-start"
        >
          Analytics settings
        </button>
      )}

      {/* App-styled confirmation instead of the browser's confirm() box. */}
      <Sheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset all data to zero?"
        description={
          store.mode === 'shared'
            ? 'All employees, subscriptions and requests are removed for everyone in this workspace, and every total goes back to 0. This cannot be undone.'
            : 'All employees, subscriptions and requests are removed, and every total goes back to 0. This cannot be undone.'
        }
      >
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            store.clearAllData();
            setResetOpen(false);
          }}
        >
          Reset to zero
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => setResetOpen(false)}>
          Keep my data
        </Button>
      </Sheet>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  unit: string;
  footnote: string;
  icon: Icon;
  tone?: 'default' | 'brand' | 'warn';
  /** Makes the whole card a link. */
  to?: string;
};

const metricTone = {
  default: {
    card: 'border-line bg-surface shadow-card',
    label: 'text-muted',
    value: 'text-brand-ink',
    unit: 'text-muted',
    foot: 'text-muted',
    chip: 'bg-canvas text-muted',
  },
  brand: {
    card: 'border-brand bg-brand shadow-raised',
    label: 'text-brand-on-dark',
    value: 'text-surface',
    unit: 'text-brand-on-dark',
    foot: 'text-brand-on-dark',
    chip: 'bg-surface/10 text-surface',
  },
  warn: {
    card: 'border-warn-line bg-warn-bg',
    label: 'text-muted',
    value: 'text-brand-ink',
    unit: 'text-muted',
    foot: 'text-warn-ink',
    chip: 'bg-surface text-warn-ink',
  },
} as const;

function MetricCard({ label, value, unit, footnote, icon: Icon, tone = 'default', to }: MetricCardProps) {
  const t = metricTone[tone];
  const body: ReactNode = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className={`text-small font-medium ${t.label}`}>{label}</span>
        <span aria-hidden="true" className={`flex size-7 items-center justify-center rounded-sm ${t.chip}`}>
          <Icon size={16} />
        </span>
      </span>
      <p className="flex items-baseline gap-1.5">
        <span className={`text-[26px] font-semibold leading-none tracking-[-0.03em] lg:text-display ${t.value}`}>
          {value}
        </span>
        <span className={`text-small ${t.unit}`}>{unit}</span>
      </p>
      <span className={`text-caption ${t.foot}`}>
        {footnote}
        {to && <span aria-hidden="true">&nbsp;&nbsp;→</span>}
      </span>
    </>
  );
  const cls = `flex min-w-0 flex-col gap-3 rounded-xl border p-4 lg:p-5 ${t.card}`;
  return to ? (
    <Link
      to={to}
      className={`${cls} transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
