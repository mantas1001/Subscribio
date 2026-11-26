import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Toast from '../../components/ui/Toast';
import TopBar from '../../components/ui/TopBar';
import type { Employee } from '../../types';

// Job 3 (Role C): Add employee, frames 5.1–5.3.
// 5.1 form, 5.2 clear recoverable duplicate-email error, 5.3 success confirmation.
// Uses the shared store's addEmployee (duplicate email is case-insensitive).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddEmployeePage() {
  const { addEmployee } = useStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState<Employee | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (emailError && !submitting) emailRef.current?.focus();
  }, [emailError, submitting]);

  function clearMessages() {
    setNameError(null);
    setEmailError(null);
    setAdded(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameError(null);
    setEmailError(null);
    setAdded(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    let valid = true;

    if (!cleanName) {
      setNameError('Enter a name.');
      valid = false;
    }
    if (!cleanEmail) {
      setEmailError('Enter an email address.');
      valid = false;
    } else if (!EMAIL_RE.test(cleanEmail)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      // Let the loading state render; no backend call.
      await Promise.resolve();
      const result = addEmployee({ name: cleanName, email: cleanEmail });

      if (!result.ok) {
        // Recoverable: keep input, surface error, allow retry after editing.
        const message = result.existing
          ? `${result.existing.name} already uses this email.`
          : result.error;
        setEmailError(message);
        return;
      }

      setAdded(result.employee);
      setName('');
      setEmail('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-6 pt-4">
      <TopBar
        title="Add employee"
        onBack={() => navigate('/employees')}
        backLabel="Back"
        className="px-gutter lg:px-0"
      />

      <div className="flex flex-col gap-4 px-gutter pt-4 lg:px-0">
        <div>
          <h1 className="text-title font-semibold text-brand-ink">Add employee</h1>
          <p className="mt-1 text-body text-muted">
            Add a team member. They’ll appear in your employee list. All data is example data.
          </p>
        </div>

        {added && (
          <div className="grid gap-4 md:grid-cols-2">
            <Toast
              variant="success"
              title="Employee added"
              message={`${added.name} (${added.email}) has been added. They are now in your employee list.`}
              onDismiss={() => setAdded(null)}
            />
            <Card>
              <p className="text-small font-medium text-brand-ink">What happens next</p>
              <p className="mt-1 text-small text-muted">
                Open Employees to see {added.name}. No subscriptions are added until tools are
                requested and purchased.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => navigate('/employees')}>
                  Back to employees
                </Button>
              </div>
            </Card>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          noValidate
          className="mx-auto flex w-full max-w-xl flex-col gap-4"
          aria-busy={submitting}
        >
          <Card className="flex flex-col gap-4">
            <Input
              label="Name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              error={nameError ?? undefined}
              autoComplete="name"
              required
              disabled={submitting}
              placeholder="e.g. Sam Rivera"
            />
            <Input
              ref={emailRef}
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError ?? undefined}
              autoComplete="email"
              required
              disabled={submitting}
              placeholder="name@example.com"
              inputMode="email"
            />
          </Card>

          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            aria-busy={submitting}
            className="w-full sm:w-auto sm:self-start"
          >
            {submitting ? 'Adding…' : 'Add employee'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/employees')}
            disabled={submitting}
            className="w-full sm:w-auto sm:self-start"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setName('');
              setEmail('');
            }}
            className="self-center rounded-sm px-2 py-1 text-caption text-muted underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            disabled={submitting}
          >
            Clear form
          </button>
        </form>
      </div>
    </div>
  );
}
