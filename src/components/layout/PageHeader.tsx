import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Page-level actions (buttons/links). Shown to the right of the title on desktop. */
  actions?: ReactNode;
  /** Hide the actions on phones, when the page shows them elsewhere (e.g. below the content). */
  actionsDesktopOnly?: boolean;
};

/** Top of a main screen: title, one-line description, page actions. */
export default function PageHeader({ title, description, actions, actionsDesktopOnly }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-title font-semibold text-brand-ink">{title}</h1>
        {description && <p className="max-w-[60ch] text-body text-muted">{description}</p>}
      </div>
      {actions && (
        <div className={`${actionsDesktopOnly ? 'hidden lg:flex' : 'flex'} shrink-0 flex-wrap items-center gap-2`}>
          {actions}
        </div>
      )}
    </div>
  );
}
