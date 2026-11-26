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

/** Screen header: back button on the left, title centred (as in Figma 2.2 and 5.1), optional trailing content. */
export default function TopBar({
  title,
  onBack,
  backLabel = 'Back',
  trailing,
  className = '',
}: TopBarProps) {
  return (
    <header
      className={`sticky top-0 z-10 grid min-h-header grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-surface px-gutter lg:px-0 ${className}`.trim()}
    >
      <div className="justify-self-start">
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
      </div>
      <h1 className="min-w-0 truncate text-center text-base font-semibold text-brand-ink">{title}</h1>
      <div className="justify-self-end">{trailing}</div>
    </header>
  );
}
