import type { HTMLAttributes, ReactNode } from 'react';

type ErrorMessageProps = HTMLAttributes<HTMLDivElement> & {
  /** Error body. */
  message: ReactNode;
  /** Optional heading. Default: "Something went wrong". */
  title?: ReactNode;
};

/** Inline error. Announced to assistive tech; colour is not the only signal. */
export default function ErrorMessage({
  message,
  title = 'Something went wrong',
  className = '',
  ...rest
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className={`rounded-lg border border-danger-line bg-surface px-4 py-3 text-small text-danger ${className}`.trim()}
      {...rest}
    >
      <p className="font-semibold text-danger">{title}</p>
      <div className="text-brand-ink">{message}</div>
    </div>
  );
}
