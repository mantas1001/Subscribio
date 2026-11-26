import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone = 'default' | 'brand' | 'warn' | 'danger' | 'success';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, string> = {
  default: 'border-line bg-surface text-brand-ink',
  brand: 'border-brand bg-brand-soft text-brand',
  warn: 'border-warn-line bg-warn-bg text-warn-ink',
  danger: 'border-danger-line bg-surface text-danger',
  success: 'border-brand bg-brand-soft text-brand',
};

/** Small status label. Colour is never the only signal; keep text meaningful. */
export default function Badge({ children, tone = 'default', className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-caption font-medium ${tones[tone]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </span>
  );
}
