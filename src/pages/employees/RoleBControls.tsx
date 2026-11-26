import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export function Button({ variant = 'primary', className = '', ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const colors = {
    primary: 'border-brand bg-brand text-surface',
    secondary: 'border-line bg-surface text-brand-ink',
    danger: 'border-danger bg-danger text-surface',
  };

  return <button type="button" className={`min-h-[52px] rounded-lg border px-4 py-3 font-medium disabled:opacity-65 ${colors[variant]} ${className}`} {...props} />;
}

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-line bg-surface ${className}`} {...props} />;
}

export function ListRow({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="flex min-h-[69px] items-center gap-3 border-line px-4 py-3 [&+&]:border-t">
      {children}
      <span aria-hidden="true" className="shrink-0 text-2xl text-brand-accent-text">›</span>
    </Link>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-sm bg-brand-soft px-2 py-1 text-caption font-medium text-brand">{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="space-y-2 p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-small text-muted">{description}</p>
    </Card>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return <p role="alert" className="rounded-lg border border-danger-line bg-surface p-4 text-small text-danger">{message}</p>;
}
