import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';

// Local building blocks for the request flow.
// TODO(Role A): swap LocalButton / LocalBadge / LocalTopBar for Role C's
// src/components/ui/{Button,Badge,TopBar} once they are on main.

type Variant = 'primary' | 'secondary' | 'danger' | 'danger-outline';

const variantClass: Record<Variant, string> = {
  primary: 'bg-brand text-surface border border-brand',
  secondary: 'bg-surface text-brand-ink border border-line',
  danger: 'bg-danger text-surface border border-danger',
  'danger-outline': 'bg-surface text-danger border border-danger-line',
};

export function LocalButton({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={`flex w-full items-center justify-center rounded-lg px-4 py-3.5 text-base font-medium transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass[variant]} ${className}`}
    />
  );
}

export function LocalLinkButton({
  to,
  variant = 'primary',
  children,
}: {
  to: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`flex w-full items-center justify-center rounded-lg px-4 py-3.5 text-base font-medium ${variantClass[variant]}`}
    >
      {children}
    </Link>
  );
}

export function LocalBadge({ tone, children }: { tone: 'pending' | 'approved'; children: ReactNode }) {
  const toneClass =
    tone === 'pending' ? 'bg-warn-bg text-warn-ink' : 'bg-brand-soft text-brand';
  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-caption font-medium ${toneClass}`}>
      {children}
    </span>
  );
}

export function LocalTopBar({ title, backTo }: { title: string; backTo?: string }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="relative flex h-header items-center justify-center px-gutter">
        <button
          type="button"
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="absolute left-3 flex items-center gap-1 rounded-sm px-2 py-1 text-base text-brand-ink"
        >
          <span aria-hidden="true">‹</span> Back
        </button>
        <h1 className="text-base font-semibold text-brand-ink">{title}</h1>
      </div>
    </header>
  );
}

/** Fixed bottom area with the screen's main actions (sits above the tab bar when shown). */
export function ActionBar({ children, aboveTabBar = false }: { children: ReactNode; aboveTabBar?: boolean }) {
  return (
    <>
      <div aria-hidden="true" className="h-36" />
      <div
        className={`fixed left-1/2 z-10 flex w-full max-w-app -translate-x-1/2 flex-col gap-3 border-t border-line bg-surface px-3 py-3 ${
          aboveTabBar ? 'bottom-tabbar' : 'bottom-0'
        }`}
      >
        {children}
      </div>
    </>
  );
}

/** Bottom sheet built on <dialog>, so focus, Escape and screen readers work out of the box. */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="sheet-title"
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-app rounded-t-[20px] bg-surface p-0 text-brand-ink backdrop:bg-brand-ink/40"
    >
      <div className="flex flex-col gap-3 px-gutter pb-5 pt-3">
        <span aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-line" />
        <h2 id="sheet-title" className="text-[20px] font-semibold">
          {title}
        </h2>
        {description && <p className="text-body text-muted">{description}</p>}
        {children}
      </div>
    </dialog>
  );
}

export function ToolTile({ tool, size = 'md' }: { tool: string; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-14 text-[22px] rounded-lg' : 'size-11 text-[17px] rounded-md';
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-brand-soft font-semibold text-brand ${box}`}
    >
      {tool.charAt(0)}
    </span>
  );
}

export function StatusIcon({ tone }: { tone: 'success' | 'declined' }) {
  return tone === 'success' ? (
    <span
      aria-hidden="true"
      className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-[22px] font-bold text-brand"
    >
      ✓
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-[22px] font-bold text-danger"
    >
      –
    </span>
  );
}

/** Key/value table used on request detail and purchase recorded. */
export function DetailTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="overflow-hidden rounded-xl border border-line bg-surface">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-4 border-b border-line px-4 py-3.5 last:border-b-0">
          <dt className="w-[100px] shrink-0 text-small text-muted">{label}</dt>
          <dd className="text-base font-medium text-brand-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Looks up a request and its employee. Renders a recoverable error if the id is unknown. */
export function useRequest(requestId: string | undefined) {
  const { requests, employees } = useStore();
  const request = requests.find((r) => r.id === requestId);
  const employee = request ? employees.find((e) => e.id === request.employeeId) : undefined;
  return { request, employee };
}

export function RequestNotFound() {
  return (
    <div className="flex flex-col gap-4 px-gutter pt-6">
      <h1 className="text-title font-semibold">Request not found</h1>
      <p className="text-body text-muted">
        This request no longer exists. It may have been removed when the example data was reset.
      </p>
      <LocalLinkButton to="/requests">Back to requests</LocalLinkButton>
    </div>
  );
}

export const firstName = (name?: string) => name?.split(' ')[0] ?? 'This person';
export const initials = (name?: string) =>
  (name ?? '?')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
