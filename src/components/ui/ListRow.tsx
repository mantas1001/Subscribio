import type { HTMLAttributes, ReactNode } from 'react';

type ListRowProps = Omit<HTMLAttributes<HTMLLIElement>, 'title'> & {
  children?: ReactNode;
  /** Optional leading content, e.g. an avatar or icon. */
  leading?: ReactNode;
  /** Optional trailing content, e.g. a value or badge. */
  trailing?: ReactNode;
  /** Show a chevron to signal the row is tappable. Default: false. */
  chevron?: boolean;
};

/** A single row in a list. Renders a list item; place inside <ul>. */
export default function ListRow({
  children,
  leading,
  trailing,
  chevron = false,
  className = '',
  ...rest
}: ListRowProps) {
  return (
    <li
      className={`flex list-none items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 lg:px-4 lg:py-4 ${className}`.trim()}
      {...rest}
    >
      {leading}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing}
      {chevron && (
        <span aria-hidden="true" className="text-muted">
          ›
        </span>
      )}
    </li>
  );
}
