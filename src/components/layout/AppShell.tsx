import { NavLink, Outlet, useLocation, matchPath } from 'react-router-dom';
import { useStore } from '../../store';

// App frame.
// Desktop (lg, 1024 px and wider) is the main target (issue #10): a left sidebar with the
// logo and navigation, and the page content using the width (up to 1100 px).
// Below 1024 px the Figma phone layout stays: logo header, content column, bottom tab bar.

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
  '/add-employee', // frames 5.1–5.3: one bottom action, no tab bar
  '/add-subscription', // same pattern as Add employee
];

const matches = (patterns: string[], pathname: string) =>
  patterns.some((p) => matchPath(p, pathname));

export default function AppShell({ customChrome = false }: { customChrome?: boolean }) {
  const { pathname } = useLocation();
  // customChrome: Role B's screens draw their own header and tab bar (RoleBLayout).
  const showHeader = !customChrome && matches(HEADER_ROUTES, pathname);
  const showTabBar = !customChrome && !matches(NO_TABBAR_ROUTES, pathname);

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar />
      <div className="relative mx-auto flex min-h-screen w-full max-w-app flex-col bg-canvas shadow-[0_0_0_1px_theme(colors.line)] lg:mx-0 lg:max-w-none lg:flex-1 lg:shadow-none">
        {showHeader && <Header />}
        <main
          className={`flex-1 ${showTabBar ? 'pb-[calc(theme(spacing.tabbar)+24px)]' : customChrome ? '' : 'pb-6'} lg:pb-12`}
        >
          <div className="lg:mx-auto lg:max-w-desktop lg:px-6 lg:pt-6">
            <Outlet />
          </div>
        </main>
        {showTabBar && <TabBar />}
      </div>
    </div>
  );
}

/** Desktop navigation (lg and wider). Replaces the logo header and the bottom tab bar. */
function Sidebar() {
  const { pendingRequestCount } = useStore();
  const item = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-base ${
      isActive ? 'bg-brand-soft font-semibold text-brand' : 'text-brand-ink hover:bg-canvas'
    }`;
  return (
    <aside className="sticky top-0 hidden h-screen w-sidebar shrink-0 flex-col gap-8 border-r border-line bg-surface px-4 py-6 lg:flex">
      <Logo />
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          <li>
            <NavLink to="/" end className={item}>
              <OverviewIcon />
              Overview
            </NavLink>
          </li>
          <li>
            <NavLink to="/employees" className={item}>
              <EmployeesIcon />
              Employees
            </NavLink>
          </li>
          <li>
            <NavLink to="/requests" className={item}>
              <RequestsIcon count={0} />
              <span className="flex-1">Requests</span>
              {pendingRequestCount > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-caption font-medium text-surface">
                  {pendingRequestCount}
                  <span className="sr-only"> pending</span>
                </span>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>
      <span className="mt-auto self-start rounded-full border border-warn-line bg-warn-bg px-2 py-0.5 text-caption font-medium text-warn-ink">
        Example data
      </span>
    </aside>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-0.5 px-1">
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
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface lg:hidden">
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
      className="fixed bottom-0 left-1/2 z-10 w-full max-w-app -translate-x-1/2 border-t border-line bg-surface lg:hidden"
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
