import type { ReactNode } from 'react';
import { CaretLeft } from '@phosphor-icons/react';

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

/**
 * Screen header.
 * Phone: sticky bar, back on the left, title centred (as in Figma 2.2 and 5.1).
 * Desktop: a quiet "‹ Back" breadcrumb above the page; the title stays for screen readers,
 * because the page's own heading already names the screen visually.
 */
export default function TopBar({
  title,
  onBack,
  backLabel = 'Back',
  trailing,
  className = '',
}: TopBarProps) {
  return (
    <header
      className={`sticky top-0 z-10 grid min-h-header grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-surface/95 px-gutter backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:static lg:flex lg:min-h-0 lg:border-0 lg:bg-transparent lg:px-gutter lg:pt-2 lg:backdrop-blur-none ${className}`.trim()}
    >
      <div className="justify-self-start">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 inline-flex min-h-[44px] items-center gap-1 rounded-sm px-1 text-small font-medium text-brand-ink transition-[color] duration-150 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:min-h-[32px] lg:text-muted lg:hover:text-brand-ink"
          >
            <CaretLeft size={16} weight="bold" aria-hidden="true" />
            {backLabel}
          </button>
        )}
      </div>
      <h1 className="min-w-0 truncate text-center text-base font-semibold text-brand-ink lg:sr-only">{title}</h1>
      <div className="justify-self-end lg:ml-auto">{trailing}</div>
    </header>
  );
}
