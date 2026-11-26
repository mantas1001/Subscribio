import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store';

// Request-flow pieces that the shared kit (src/components/ui/, Role C) does not have.
// Buttons, badges, top bar, cards, inputs and the empty state come from the shared kit.

// Same look as the shared Button (src/components/ui/Button.tsx), but rendered as a link,
// because these actions navigate. Ask Role C to add a link option to Button, then delete this.
const linkButtonBase =
  'inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 py-3 text-base font-semibold leading-none transition-colors';
const linkButtonVariants = {
  primary: 'border-brand bg-brand text-surface hover:bg-brand-ink hover:border-brand-ink',
  secondary: 'border-line bg-surface text-brand-ink hover:bg-brand-soft',
} as const;

export function LinkButton({
  to,
  variant = 'primary',
  children,
}: {
  to: string;
  variant?: keyof typeof linkButtonVariants;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${linkButtonBase} ${linkButtonVariants[variant]}`}>
      {children}
    </Link>
  );
}

/** Outlined red style for "Decline" (frame 2.2); the shared Button has only a filled danger variant. */
export const declineButtonClass = 'w-full !border-danger-line !text-danger hover:!bg-danger-soft';

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

// Tool logo colours as in Figma: Ahrefs is orange (frames 1.1, 4.1), other tools light green (2.1).
// Decorative only (aria-hidden): the tool name is always written next to it.
const toolTileColour = (tool: string) =>
  tool === 'Ahrefs' ? 'bg-tool-ahrefs text-surface' : 'bg-brand-soft text-brand';

export function ToolTile({ tool, size = 'md' }: { tool: string; size?: 'sm' | 'md' | 'lg' }) {
  const box =
    size === 'lg'
      ? 'size-14 text-[22px] rounded-lg'
      : size === 'sm'
        ? 'size-10 text-[17px] rounded-md'
        : 'size-11 text-[17px] rounded-md';
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center font-semibold ${toolTileColour(tool)} ${box}`}
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
      <LinkButton to="/requests">Back to requests</LinkButton>
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
