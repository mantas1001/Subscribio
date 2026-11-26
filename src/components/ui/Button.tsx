import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-outline';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual style. Default: primary. */
  variant?: ButtonVariant;
  children: ReactNode;
};

const base =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 py-3 text-base font-semibold leading-none whitespace-nowrap select-none transition-[color,background-color,border-color,transform] duration-150 ease-out active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none aria-invalid:border-danger lg:px-5';

const variants: Record<ButtonVariant, string> = {
  primary:
    'border-brand bg-brand text-surface hover:bg-brand-ink hover:border-brand-ink active:bg-brand-ink active:border-brand-ink aria-pressed:bg-brand-ink aria-pressed:border-brand-ink',
  secondary:
    'border-line bg-surface text-brand-ink hover:bg-brand-soft active:bg-brand-soft aria-pressed:bg-brand-soft',
  danger:
    'border-danger bg-danger text-surface hover:border-danger-line hover:bg-danger active:border-danger-line active:bg-danger aria-pressed:border-danger-line aria-pressed:bg-danger',
  // Outlined red, e.g. "Decline" (Figma 2.2) and "Cancel subscription" (4.1).
  'danger-outline':
    'border-danger-line bg-surface text-danger hover:bg-danger-soft active:bg-danger-soft aria-pressed:bg-danger-soft',
};

/** Class string for the button look. Shared by Button and LinkButton so both always match. */
export function buttonClasses(variant: ButtonVariant = 'primary', className = '') {
  return `${base} ${variants[variant]} ${className}`.trim();
}

/**
 * Button. Variants: primary | secondary | danger | danger-outline. Supports disabled, pressed
 * (`aria-pressed`), invalid/error (`aria-invalid`), and visible focus.
 * Default type is "button"; forms opt into type="submit".
 * For navigation use LinkButton (same look, but a real link).
 */
export default function Button({
  variant = 'primary',
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...rest}>
      {children}
    </button>
  );
}
