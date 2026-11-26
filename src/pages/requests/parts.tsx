import { useEffect, useRef, type ReactNode } from 'react';
import { useStore } from '../../store';
import LinkButton from '../../components/ui/LinkButton';

// Request-flow pieces that the shared kit (src/components/ui/) does not have:
// ActionBar, Sheet, ToolTile, StatusIcon, DetailTable. Buttons, links, badges, top bar,
// cards, inputs and the empty state come from the shared kit.

/**
 * The screen's main actions. Phone: fixed to the bottom (above the tab bar when shown).
 * Desktop: an inline row of buttons under the content, aligned left.
 */
export function ActionBar({ children, aboveTabBar = false }: { children: ReactNode; aboveTabBar?: boolean }) {
  return (
    <>
      <div aria-hidden="true" className="h-36 lg:hidden" />
      <div
        className={`fixed left-1/2 z-10 flex w-full max-w-app -translate-x-1/2 flex-col gap-3 border-t border-line bg-surface px-3 py-3 ${
          aboveTabBar ? 'bottom-tabbar' : 'bottom-0'
        } lg:static lg:mt-6 lg:max-w-2xl lg:translate-x-0 lg:flex-row lg:border-0 lg:bg-transparent lg:px-gutter lg:py-0 lg:[&>*]:w-auto lg:[&>*]:min-w-[200px]`}
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
      // Phone: bottom sheet. Desktop: centred dialog.
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-app rounded-t-[20px] bg-surface p-0 text-brand-ink backdrop:bg-brand-ink/40 lg:inset-0 lg:m-auto lg:h-fit lg:max-w-md lg:rounded-[20px]"
    >
      <div className="flex flex-col gap-3 px-gutter pb-5 pt-3 lg:px-6 lg:pb-6 lg:pt-6">
        <span aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-line lg:hidden" />
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
      −
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
    <div className="flex flex-col gap-4 px-gutter pt-6 lg:max-w-2xl">
      <h1 className="text-title font-semibold">Request not found</h1>
      <p className="text-body text-muted">
        This request no longer exists. It may have been removed when the example data was reset.
      </p>
      <LinkButton className="w-full" to="/requests">Back to requests</LinkButton>
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
