import { NavLink, Outlet, useLocation, matchPath } from 'react-router-dom';
import { useStore } from '../../store';

// App frame from Figma: fixed header (logo), scrolling content, fixed tab bar.
// On a wide screen everything sits in a centred 440 px column.

// Screens that show the logo header (as in Figma). Other detail screens draw their own TopBar.
const HEADER_ROUTES = [
  '/',
  '/requests',
  '/employees',
  '/requests/:requestId/approved',
  '/requests/:requestId/purchase',
  '/requests/:requestId/recorded',
  '/requests/:requestId/declined',
];
// Screens with their own bottom action bar and no tab bar in Figma.
const NO_TABBAR_ROUTES = [
  '/requests/:requestId',
  '/requests/:requestId/approved',
  '/requests/:requestId/recorded',
  '/requests/:requestId/declined',
];

const matches = (patterns: string[], pathname: string) =>
  patterns.some((p) => matchPath(p, pathname));

export default function AppShell({ customChrome = false }: { customChrome?: boolean }) {
  const { pathname } = useLocation();
  // customChrome: Role B's screens draw their own header and tab bar (RoleBLayout).
  const showHeader = !customChrome && matches(HEADER_ROUTES, pathname);
  const showTabBar = !customChrome && !matches(NO_TABBAR_ROUTES, pathname);

  return (
    <div className="min-h-screen bg-canvas">
      <div className={`relative mx-auto flex min-h-screen w-full max-w-app flex-col bg-canvas shadow-[0_0_0_1px_theme(colors.line)] ${customChrome ? 'lg:max-w-none' : ''}`}>
        {showHeader && <Header />}
        <main className={`flex-1 ${showTabBar ? 'pb-[calc(theme(spacing.tabbar)+24px)]' : customChrome ? '' : 'pb-6'}`}>
          <Outlet />
        </main>
        {showTabBar && <TabBar />}
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="flex h-header items-center gap-0.5 px-gutter">
        <span
          aria-hidden="true"
          className="mr-1 flex size-[30px] flex-col items-center justify-center gap-0.5 rounded-sm bg-brand"
        >
          <span className="h-[3px] w-[10px] rounded-[1.5px] bg-surface" />
          <span className="h-[3px] w-[14px] rounded-[1.5px] bg-surface" />
        </span>
        <span className="text-[20px] font-bold text-brand">subscribio</span>
        <span aria-hidden="true" className="text-[20px] font-bold text-brand-accent">
          .
        </span>
        <span className="flex-1" />
        <span className="rounded-full border border-warn-line bg-warn-bg px-2 py-0.5 text-caption font-medium text-warn-ink">
          Example data
        </span>
      </div>
    </header>
  );
}

export function TabBar({ activeTab }: { activeTab?: 'overview' | 'employees' }) {
  const { pendingRequestCount } = useStore();
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-1/2 z-10 w-full max-w-app -translate-x-1/2 border-t border-line bg-surface"
    >
      <ul className="flex h-tabbar gap-2">
        <Tab to="/" end label="Overview" active={activeTab === 'overview'} icon={<OverviewIcon />} />
        <Tab to="/employees" label="Employees" active={activeTab === 'employees'} icon={<EmployeesIcon />} />
        <Tab
          to="/requests"
          label="Requests"
          icon={<RequestsIcon count={pendingRequestCount} />}
          srExtra={pendingRequestCount > 0 ? `, ${pendingRequestCount} pending` : undefined}
        />
      </ul>
    </nav>
  );
}

function Tab({
  to,
  label,
  icon,
  end,
  srExtra,
  active,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  srExtra?: string;
  active?: boolean;
}) {
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex h-full flex-col items-center justify-center gap-[3px] text-[12px] ${
            isActive || active ? 'font-semibold text-brand' : 'text-muted'
          }`
        }
      >
        {icon}
        <span>
          {label}
          {srExtra && <span className="sr-only">{srExtra}</span>}
        </span>
      </NavLink>
    </li>
  );
}

function OverviewIcon() {
  return (
    <span aria-hidden="true" className="flex size-6 items-center justify-center">
      <span className="grid size-5 grid-cols-2 gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="rounded-[2px] border-[1.8px] border-current" />
        ))}
      </span>
    </span>
  );
}

function EmployeesIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RequestsIcon({ count }: { count: number }) {
  return (
    <span aria-hidden="true" className="relative flex size-6 items-center justify-center">
      <span className="flex h-[21px] w-[17px] items-center justify-center rounded-[4px] border-[1.8px] border-current text-[11px] font-bold">
        ✓
      </span>
      {count > 0 && (
        <span className="absolute -top-[7px] left-3 flex size-[17px] items-center justify-center rounded-[9px] border-[1.5px] border-surface bg-brand text-[10px] font-medium text-surface">
          {count}
        </span>
      )}
    </span>
  );
}
