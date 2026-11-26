import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ErrorMessage from '../../components/ui/ErrorMessage';
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
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState<Employee | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  function clearMessages() {
    setNameError(null);
    setEmailError(null);
    setFormError(null);
    setAdded(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
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
        setEmailError(result.error);
        setFormError(result.error);
        emailRef.current?.focus();
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
    <div className="flex flex-col gap-4 pb-6">
      <TopBar title="Add employee" onBack={() => navigate('/employees')} backLabel="Back" />

      <div className="flex flex-col gap-4 px-gutter pt-4">
        <div>
          <h1 className="text-title font-semibold text-brand-ink">Add employee</h1>
          <p className="mt-1 text-body text-muted">
            Add a team member. They’ll appear in your employee list. All data is example data.
          </p>
        </div>

        {added && (
          <>
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
          </>
        )}

        {formError && !emailError && <ErrorMessage title="Couldn’t add employee" message={formError} />}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-busy={submitting}>
          <Card className="flex flex-col gap-4">
            <Input
              label="Name"
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
                if (formError) setFormError(null);
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
                if (formError) setFormError(null);
              }}
              error={emailError ?? undefined}
              autoComplete="email"
              required
              disabled={submitting}
              placeholder="name@example.com"
              inputMode="email"
            />
          </Card>

          <Button type="submit" variant="primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Adding…' : 'Add employee'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/employees')} disabled={submitting}>
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
