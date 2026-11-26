import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/** Surface container: rounded, bordered, padded. */
export default function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div className={`rounded-xl border border-line bg-surface p-4 ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
