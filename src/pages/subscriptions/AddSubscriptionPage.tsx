import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  REFERENCE_DATE,
  addMonths,
  formatEur,
  formatLongDate,
  plural,
  useStore,
  type AddSubscriptionField,
} from '../../store';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import LinkButton from '../../components/ui/LinkButton';
import TopBar from '../../components/ui/TopBar';
import { Header } from '../../components/layout/AppShell';
import { ActionBar, StatusIcon, ToolTile } from '../requests/parts';
import type { Subscription } from '../../types';

// Add a subscription by hand: tool, optional plan, seats, monthly cost, next renewal and who uses it.
// Same pattern as Add employee (5.1–5.3): form, inline errors, confirmation screen.
// Saved in the shared store, so Overview, Employees and Renewal detail update straight away.

const selectClass =
  'min-h-[44px] rounded-md border bg-surface px-3 py-2.5 text-base text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50';

/** "29", "29.5", "29,50" or "€29.00" → 29.5; anything else → NaN. */
const parseEuro = (text: string) => {
  const cleaned = text.replace(/[€\s]/g, '').replace(',', '.');
  return /^\d+(\.\d{1,2})?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
};

export default function AddSubscriptionPage() {
  const { employees, addSubscription } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselected = employees.some((e) => e.id === params.get('employee')) ? params.get('employee')! : '';

  const [tool, setTool] = useState('');
  const [plan, setPlan] = useState('');
  const [seats, setSeats] = useState('1');
  const [cost, setCost] = useState('');
  const [renewalDate, setRenewalDate] = useState(addMonths(REFERENCE_DATE, 1));
  const [employeeId, setEmployeeId] = useState(preselected);
  const [errors, setErrors] = useState<Partial<Record<AddSubscriptionField, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState<{ subscription: Subscription; ownerName: string } | null>(null);
  const toolRef = useRef<HTMLInputElement>(null);
  const [focusField, setFocusField] = useState<AddSubscriptionField | null>(null);

  // After a failed save, put keyboard focus on the first field with an error. Waits until the
  // fields are enabled again: a disabled field cannot take focus.
  useEffect(() => {
    if (!focusField || submitting) return;
    document.getElementById(`sub-${focusField}`)?.focus();
    setFocusField(null);
  }, [focusField, submitting]);

  const clear = (field: AddSubscriptionField) =>
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350)); // short "Saving…" state, no backend
      const result = addSubscription({
        tool,
        plan,
        seats: /^\d+$/.test(seats.trim()) ? Number(seats) : Number.NaN,
        monthlyCostEur: parseEuro(cost),
        renewalDate,
        employeeId,
      });
      if (!result.ok) {
        setErrors(result.errors);
        // Focus the first field with an error once the form is enabled again (see effect above).
        const order: AddSubscriptionField[] = ['tool', 'seats', 'monthlyCostEur', 'renewalDate', 'employeeId'];
        setFocusField(order.find((f) => result.errors[f]) ?? null);
        return;
      }
      setAdded({
        subscription: result.subscription,
        ownerName: employees.find((e) => e.id === employeeId)?.name ?? 'your team member',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setAdded(null);
    setTool('');
    setPlan('');
    setSeats('1');
    setCost('');
    setRenewalDate(addMonths(REFERENCE_DATE, 1));
    setErrors({});
    setTimeout(() => toolRef.current?.focus(), 0);
  }

  // No one to assign it to yet: explain the next step instead of showing a form that cannot work.
  if (employees.length === 0) {
    return (
      <>
        <TopBar title="Add subscription" onBack={() => navigate(-1)} />
        <div className="flex flex-col gap-4 px-gutter pt-5 lg:max-w-xl">
          <EmptyState
            title="Add a team member first"
            description="Every subscription belongs to someone on your team. Add an employee, then come back to add their tools."
            action={<LinkButton to="/add-employee">Add employee</LinkButton>}
          />
        </div>
      </>
    );
  }

  // Confirmation
  if (added) {
    const s = added.subscription;
    return (
      <>
        <Header />
        <div className="flex flex-col gap-4 px-gutter pt-6 lg:max-w-2xl" role="status">
          <StatusIcon tone="success" />
          <h1 className="text-title font-semibold text-brand-ink">Subscription added</h1>
          <p className="text-body text-muted">
            {s.tool} is now active for {added.ownerName} and counts toward monthly spend.
          </p>
          <Card className="flex items-center gap-3">
            <ToolTile tool={s.tool} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-brand-ink">
                {s.tool}
                {s.plan ? ` · ${s.plan}` : ''}
              </span>
              <span className="text-small text-muted">
                {plural(s.seats, 'seat')} · renews {formatLongDate(s.renewalDate)}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="text-base font-semibold text-brand-ink">{formatEur(s.monthlyCostEur)}</span>
              <Badge tone="success">Active</Badge>
            </span>
          </Card>
        </div>
        <ActionBar>
          <LinkButton className="w-full" to="/">
            Back to overview
          </LinkButton>
          <Button variant="secondary" className="w-full" onClick={startOver}>
            Add another
          </Button>
        </ActionBar>
      </>
    );
  }

  // Form
  return (
    <>
      <TopBar title="Add subscription" onBack={() => navigate(-1)} />
      <form
        id="add-subscription-form"
        onSubmit={onSubmit}
        noValidate
        aria-busy={submitting}
        className="flex flex-col gap-4 px-gutter pt-5 lg:max-w-xl"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-title font-semibold text-brand-ink">Add a subscription</h2>
          <p className="text-body text-muted">
            Record a tool your company already pays for. It counts toward monthly spend straight away.
          </p>
        </div>

        <Input
          ref={toolRef}
          id="sub-tool"
          label="Tool"
          value={tool}
          onChange={(e) => {
            setTool(e.target.value);
            clear('tool');
          }}
          error={errors.tool}
          disabled={submitting}
          placeholder="e.g. Figma"
          autoComplete="off"
        />
        <Input
          id="sub-plan"
          label="Plan (optional)"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          disabled={submitting}
          placeholder="e.g. Professional"
          autoComplete="off"
        />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Input
              id="sub-seats"
              label="Seats"
              inputMode="numeric"
              value={seats}
              onChange={(e) => {
                setSeats(e.target.value);
                clear('seats');
              }}
              error={errors.seats}
              disabled={submitting}
              className="w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <Input
              id="sub-monthlyCostEur"
              label="Monthly cost (€)"
              inputMode="decimal"
              placeholder="0.00"
              value={cost}
              onChange={(e) => {
                setCost(e.target.value);
                clear('monthlyCostEur');
              }}
              error={errors.monthlyCostEur}
              disabled={submitting}
              className={`w-full ${errors.monthlyCostEur ? '!bg-danger-soft' : ''}`}
            />
          </div>
        </div>
        <Input
          id="sub-renewalDate"
          label="Next renewal"
          type="date"
          value={renewalDate}
          onChange={(e) => {
            setRenewalDate(e.target.value);
            clear('renewalDate');
          }}
          error={errors.renewalDate}
          disabled={submitting}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sub-employeeId" className="text-small font-medium text-brand-ink">
            Used by
          </label>
          <select
            id="sub-employeeId"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              clear('employeeId');
            }}
            disabled={submitting}
            aria-invalid={errors.employeeId ? true : undefined}
            aria-describedby={errors.employeeId ? 'sub-employeeId-error' : undefined}
            className={`${selectClass} ${errors.employeeId ? 'border-danger bg-danger-soft' : 'border-line'}`}
          >
            <option value="">Choose a team member</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
                {e.role ? ` (${e.role})` : ''}
              </option>
            ))}
          </select>
          {errors.employeeId && (
            <p id="sub-employeeId-error" role="alert" className="text-small text-danger">
              {errors.employeeId}
            </p>
          )}
        </div>
      </form>

      <ActionBar>
        <Button
          type="submit"
          form="add-subscription-form"
          className="w-full"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? 'Saving…' : 'Add subscription'}
        </Button>
      </ActionBar>
    </>
  );
}
