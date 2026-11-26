import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  /** Optional action, e.g. a Button. */
  action?: ReactNode;
  /** Optional icon. */
  icon?: ReactNode;
  className?: string;
};

/** Shown when a list or view has no data. */
export default function EmptyState({ title, description, action, icon, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-4 py-8 text-center ${className}`.trim()}>
      {icon && <div className="text-muted">{icon}</div>}
      <h2 className="text-section font-semibold text-brand-ink">{title}</h2>
      {description && <p className="text-small text-muted">{description}</p>}
      {action}
    </div>
  );
}
