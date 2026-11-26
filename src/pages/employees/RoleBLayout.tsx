import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header, TabBar } from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import './role-b.css';

type Props = {
  children: ReactNode;
  title?: string;
  backTo?: string;
  footer?: ReactNode;
  tabs?: boolean;
  activeTab?: 'overview' | 'employees';
  singleAction?: boolean;
};

export default function RoleBLayout({ children, title, backTo, footer, tabs = true,
  activeTab = 'employees', singleAction = false }: Props) {
  const layout = tabs ? (footer ? 'actions-tabs' : 'tabs') : (singleAction ? 'single' : 'actions');
  return (
    <div className={`rb-shell rb-shell--${layout}`}>
      {title ? (
        <header className="rb-header grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-surface px-gutter">
          {backTo && <Link to={backTo} className="flex min-h-11 items-center gap-1 text-brand"><span aria-hidden="true">‹</span> Back</Link>}
          <span className="col-start-2 font-semibold">{title}</span>
          <span className="justify-self-end rounded-full border border-warn-line bg-warn-bg px-2 py-0.5 text-[11px] text-warn-ink">Example data</span>
        </header>
      ) : <Header />}
      <div className="rb-main">{children}</div>
      {footer && <div className="rb-footer"><div className="rb-actions">{footer}</div></div>}
      {tabs && <TabBar activeTab={activeTab} />}
    </div>
  );
}

export function Details({ rows }: { rows: readonly (readonly [string, ReactNode])[] }) {
  return (
    <Card className="rb-details">
      <dl>{rows.map(([label, value]) => (
        <div className="rb-detail-row" key={label}>
          <dt>{label}</dt><dd>{value}</dd>
        </div>
      ))}</dl>
    </Card>
  );
}

export function ToolLogo({ tool, large = false }: { tool: string; large?: boolean }) {
  return <span className={`rb-tool-logo${large ? ' rb-tool-logo--large' : ''}`}
    data-tool={tool} aria-hidden="true">{tool.trim().charAt(0).toUpperCase()}</span>;
}

export function SuccessMark() {
  return <div className="rb-success-mark" aria-hidden="true">✓</div>;
}
