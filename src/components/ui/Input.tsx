import { useId } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

type InputProps = Omit<ComponentPropsWithRef<'input'>, 'id'> & {
  /** Visible label. Always rendered. */
  label: ReactNode;
  /** Error text. When set, the input is marked invalid. */
  error?: string;
  /** Optional id; generated when omitted. */
  id?: string;
};

/** Labelled text input with optional error text and visible focus. */
export default function Input({
  label,
  error,
  id,
  className = '',
  required,
  disabled,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-small font-medium text-brand-ink">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-[44px] rounded-md border bg-surface px-3 py-2.5 text-base text-brand-ink shadow-card transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-line-strong focus-visible:border-brand focus-visible:shadow-[0_0_0_1px_theme(colors.brand.DEFAULT),0_0_0_5px_rgba(36,78,60,0.14)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger lg:min-h-[40px] lg:text-small ${error ? 'border-danger' : 'border-line'} ${className}`.trim()}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
