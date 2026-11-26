import type { ReactNode } from 'react';

type TopBarProps = {
  /** Screen title. */
  title: ReactNode;
  /** When provided, renders a back button. */
  onBack?: () => void;
  /** Back button label. Default: "Back". */
  backLabel?: string;
  /** Optional trailing content. */
  trailing?: ReactNode;
  className?: string;
};

/** Screen header: title plus optional back button. */
export default function TopBar({
  title,
  onBack,
  backLabel = 'Back',
  trailing,
  className = '',
}: TopBarProps) {
  return (
    <header
      className={`sticky top-0 z-10 flex min-h-header items-center gap-2 border-b border-line bg-surface px-gutter ${className}`.trim()}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-sm text-small font-medium text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span aria-hidden="true">‹</span>
          {backLabel}
        </button>
      )}
      <h1 className="min-w-0 flex-1 text-section font-semibold text-brand-ink">{title}</h1>
      {trailing}
    </header>
  );
}
