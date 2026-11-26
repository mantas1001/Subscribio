import type { HTMLAttributes, ReactNode } from 'react';

export type ToastVariant = 'default' | 'success' | 'error';

type ToastProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  message: ReactNode;
  title?: ReactNode;
  variant?: ToastVariant;
  /** When provided, renders a dismiss button. */
  onDismiss?: () => void;
  dismissLabel?: string;
};

const variants: Record<ToastVariant, string> = {
  default: 'border-line bg-surface text-brand-ink',
  success: 'border-brand bg-brand-soft text-brand',
  error: 'border-danger-line bg-surface text-danger',
};

/** Transient/status message. Announced politely; not colour-only. */
export default function Toast({
  message,
  title,
  variant = 'default',
  onDismiss,
  dismissLabel = 'Dismiss',
  className = '',
  ...rest
}: ToastProps) {
  const assertive = variant === 'error';
  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-small shadow-sm ${variants[variant]} ${className}`.trim()}
      {...rest}
    >
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{message}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-sm text-small font-medium underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {dismissLabel}
        </button>
      )}
    </div>
  );
}
