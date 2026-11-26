import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style. Default: primary. */
  variant?: ButtonVariant;
  children: ReactNode;
};

const base =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 py-3 text-base font-semibold leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none aria-invalid:border-danger';

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-brand bg-brand text-surface hover:bg-brand-ink hover:border-brand-ink active:bg-brand-ink active:border-brand-ink aria-pressed:bg-brand-ink aria-pressed:border-brand-ink',
  secondary:
    'border-line bg-surface text-brand-ink hover:bg-brand-soft active:bg-brand-soft aria-pressed:bg-brand-soft',
  danger:
    'border-danger bg-danger text-surface hover:border-danger-line hover:bg-danger active:border-danger-line active:bg-danger aria-pressed:border-danger-line aria-pressed:bg-danger',
};

/**
 * Button. Variants: primary | secondary | danger. Supports disabled, pressed
 * (`aria-pressed`), invalid/error (`aria-invalid`), and visible focus.
 * Default type is "button"; forms opt into type="submit".
 */
export default function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
