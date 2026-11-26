import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/** Surface container: rounded, bordered, padded, with a whisper of depth. */
export default function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface p-4 shadow-card lg:p-5 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
