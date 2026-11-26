import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENT_OPTIONS, useStore } from '../../store';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import TopBar from '../../components/ui/TopBar';
import { Header } from '../../components/layout/AppShell';
import { ActionBar, StatusIcon, initials } from '../requests/parts';
import type { Employee } from '../../types';

// Job 3: Add employee, built from Figma frames
//   5.1 Add team member  – form: Full name, Work email, Department; one "Add employee" action
//   5.2 Duplicate email  – banner + field message naming who uses the email;
//                          actions "Use a different email" / "See all team members"
//   5.3 Team member added – confirmation with the new person's card and "New" badge
// Uses the shared store's addEmployee (duplicate email check is case-insensitive).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddEmployeePage() {
  const { addEmployee } = useStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState<Employee | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  // After an email error, put the cursor back in the email field (once it is enabled again).
  useEffect(() => {
    if (emailError && !submitting) emailRef.current?.focus();
  }, [emailError, submitting]);

  async function onSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setNameError(null);
    setEmailError(null);
    setDuplicate(false);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    let valid = true;
    if (!cleanName) {
      setNameError('Enter their full name.');
      valid = false;
    }
    if (!cleanEmail) {
      setEmailError('Enter their work email.');
      valid = false;
    } else if (!EMAIL_RE.test(cleanEmail)) {
      setEmailError('Enter a valid email address, like name@example.com.');
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350)); // short "Adding…" state, no backend
      const result = addEmployee({ name: cleanName, email: cleanEmail, role: department || undefined });
      if (!result.ok) {
        // 5.2: recoverable. Keep everything typed, explain who already uses the email.
        setDuplicate(Boolean(result.existing));
        setEmailError(
          result.existing ? `This email is already used by ${result.existing.name}.` : result.error,
        );
        return;
      }
      setAdded(result.employee);
    } finally {
      setSubmitting(false);
    }
  }

  // 5.3 Team member added
  if (added) {
    return (
      <>
        <Header />
        <div className="flex flex-col gap-4 px-gutter pt-6 lg:max-w-2xl" role="status">
          <StatusIcon tone="success" />
          <h1 className="text-title font-semibold text-brand-ink">Employee added</h1>
          <p className="text-body text-muted">
            {added.role ? `${added.name} joined ${added.role}.` : `${added.name} was added to your team.`}
          </p>
          <Card className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-small font-medium text-brand"
            >
              {initials(added.name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-brand-ink">{added.name}</span>
              <span className="truncate text-small text-muted">{added.email}</span>
            </span>
            <Badge tone="success">New</Badge>
          </Card>
          <p className="text-caption text-muted">
            They have no subscriptions yet. They can send requests from their own app.
          </p>
        </div>
        <ActionBar>
          <Button className="w-full" onClick={() => navigate('/employees')}>
            Back to employees
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>
            Back to overview
          </Button>
        </ActionBar>
      </>
    );
  }

  // 5.1 form, with 5.2 shown in place when the email is already used
  return (
    <>
      <TopBar title="Add employee" onBack={() => navigate('/employees')} />
      <form
        id="add-employee-form"
        onSubmit={onSubmit}
        noValidate
        aria-busy={submitting}
        className="flex flex-col gap-4 px-gutter pt-5 lg:max-w-xl"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-title font-semibold text-brand-ink">Add an employee</h2>
          <p className="text-body text-muted">You can then assign subscriptions to them.</p>
        </div>

        {duplicate && (
          <div className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3" role="alert">
            <p className="text-body text-danger">An employee with this email already exists.</p>
          </div>
        )}

        <Input
          label="Full name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          error={nameError ?? undefined}
          autoComplete="name"
          disabled={submitting}
          placeholder="e.g. Sam Rivera"
        />
        <Input
          ref={emailRef}
          label="Work email"
          name="email"
          type="email"
          inputMode="email"
          spellCheck={false}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
            if (duplicate) setDuplicate(false); // editing the email brings back "Add employee"
          }}
          error={emailError ?? undefined}
          autoComplete="email"
          disabled={submitting}
          placeholder="name@example.com"
          className={emailError ? '!bg-danger-soft' : ''}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="employee-department" className="text-small font-medium text-brand-ink">
            Department
          </label>
          <select
            id="employee-department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            disabled={submitting}
            className="min-h-[44px] rounded-md border border-line bg-surface px-3 py-2.5 text-base text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
          >
            <option value="">Choose a department (optional)</option>
            {DEPARTMENT_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </form>

      <ActionBar>
        {duplicate ? (
          <>
            <Button
              className="w-full"
              onClick={() => {
                setEmail('');
                setEmailError(null);
                setDuplicate(false);
                emailRef.current?.focus();
              }}
            >
              Use a different email
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/employees')}>
              See all team members
            </Button>
          </>
        ) : (
          <Button
            type="submit"
            form="add-employee-form"
            className="w-full"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Adding…' : 'Add employee'}
          </Button>
        )}
      </ActionBar>
    </>
  );
}
