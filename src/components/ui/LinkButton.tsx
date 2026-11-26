import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { buttonClasses, type ButtonVariant } from './Button';

type LinkButtonProps = {
  /** Route to open, e.g. "/requests". */
  to: string;
  /** Visual style, same as Button. Default: primary. */
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

/**
 * Looks like Button, but is a real link: use it when the action only navigates
 * ("Back to overview", "Go to purchase"). Screen readers announce it as a link,
 * and it can be opened in a new tab.
 */
export default function LinkButton({ to, variant = 'primary', className = '', children }: LinkButtonProps) {
  return (
    <Link to={to} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}
