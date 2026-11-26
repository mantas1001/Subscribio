import type { ReactNode } from 'react';

export type BottomNavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  /** Marks the current destination. */
  active?: boolean;
  /** Numeric badge, e.g. pending count. */
  count?: number;
};

type BottomNavProps = {
  items: BottomNavItem[];
  /** Landmark label. Default: "Main". */
  ariaLabel?: string;
  className?: string;
};

/** Bottom tab bar. Uses plain links; works with hash routing. */
export default function BottomNav({ items, ariaLabel = 'Main', className = '' }: BottomNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={`fixed bottom-0 left-1/2 z-10 w-full max-w-app -translate-x-1/2 border-t border-line bg-surface ${className}`.trim()}
    >
      <ul className="flex h-tabbar gap-2">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <a
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`flex h-full flex-col items-center justify-center gap-[3px] text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${item.active ? 'font-semibold text-brand' : 'text-muted'}`}
            >
              {item.icon}
              <span>
                {item.label}
                {item.count != null && item.count > 0 && (
                  <span className="sr-only">, {item.count}</span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
