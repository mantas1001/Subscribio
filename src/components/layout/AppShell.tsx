import { useEffect, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, matchPath } from 'react-router-dom';
import {
  ClipboardText,
  SquaresFour,
  UsersThree,
  type Icon,
} from '@phosphor-icons/react';
import { useStore } from '../../store';
import { HeaderAccount, SidebarAccount } from './Account';
import { useAuth } from '../../auth/AuthProvider';
import { identifyClarity } from '../../analytics/clarity';

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

// Browser tab title per screen, so tabs, history and bookmarks say where you are.
const PAGE_TITLES: [string, string][] = [
  ['/', 'Overview'],
  ['/requests', 'Requests'],
  ['/requests/:requestId', 'Request'],
  ['/requests/:requestId/approved', 'Request approved'],
  ['/requests/:requestId/purchase', 'Ready to purchase'],
  ['/requests/:requestId/recorded', 'Purchase recorded'],
  ['/requests/:requestId/declined', 'Request declined'],
  ['/employees', 'Employees'],
  ['/employees/:employeeId', 'Team member'],
  ['/subscriptions/:subscriptionId', 'Renewal'],
  ['/subscriptions/:subscriptionId/cancel', 'Cancel subscription'],
  ['/subscriptions/:subscriptionId/cancelled', 'Subscription cancelled'],
  ['/subscriptions/:subscriptionId/kept', 'Subscription kept'],
  ['/add-employee', 'Add employee'],
  ['/add-subscription', 'Add subscription'],
  ['/design-system', 'Design system'],
];

/** Links Clarity recordings to the signed-in member: Supabase user ID and role only. */
function useClarityIdentity() {
  const { user } = useAuth();
  const { member } = useStore();
  const userId = user?.id;
  const role = member?.role ?? null;
  useEffect(() => {
    if (userId) identifyClarity(userId, role);
  }, [userId, role]);
}

function usePageChrome(pathname: string) {
  useEffect(() => {
    const title = PAGE_TITLES.find(([pattern]) => matchPath(pattern, pathname))?.[1];
    document.title = title ? `${title} · Subscribio` : 'Subscribio';
    // A new screen starts at the top, like a normal page load (hash routing keeps the old scroll).
    window.scrollTo(0, 0);
  }, [pathname]);
}

export default function AppShell({ customChrome = false }: { customChrome?: boolean }) {
  const { pathname } = useLocation();
  usePageChrome(pathname);
  useClarityIdentity();
  // customChrome: Role B's screens draw their own header and tab bar (RoleBLayout).
  const showHeader = !customChrome && matches(HEADER_ROUTES, pathname);
  const showTabBar = !customChrome && !matches(NO_TABBAR_ROUTES, pathname);

  return (
    <div className="min-h-[100dvh] bg-canvas lg:flex">
      {/* First thing a keyboard user reaches: jump past the navigation. */}
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault(); // hash routing: do not change the route, just move focus
          document.getElementById('main')?.focus();
        }}
        className="sr-only z-50 rounded-md bg-brand px-4 py-2 text-small font-semibold text-surface focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-app flex-col bg-canvas shadow-[0_0_0_1px_theme(colors.line)] lg:mx-0 lg:max-w-none lg:flex-1 lg:shadow-none">
        {showHeader && <Header />}
        <main
          id="main"
          tabIndex={-1}
          className={`flex-1 outline-none ${showTabBar ? 'pb-[calc(theme(spacing.tabbar)+24px)]' : customChrome ? '' : 'pb-6'} lg:pb-12`}
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
  const { pendingRequestCount, hasExampleData } = useStore();
  return (
    <aside className="sticky top-0 hidden h-[100dvh] w-sidebar shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
      <div className="px-2.5">
        <Logo />
      </div>
      <nav aria-label="Main" className="mt-8">
        <ul className="flex flex-col gap-0.5">
          <SidebarItem to="/" end label="Overview" icon={SquaresFour} />
          <SidebarItem to="/employees" label="Employees" icon={UsersThree} />
          <SidebarItem
            to="/requests"
            label="Requests"
            icon={ClipboardText}
            trailing={
              pendingRequestCount > 0 ? (
                <span className="ml-auto min-w-[22px] rounded-xs bg-brand px-1.5 py-0.5 text-center text-label font-semibold text-surface">
                  {pendingRequestCount}
                  <span className="sr-only"> pending</span>
                </span>
              ) : null
            }
          />
        </ul>
      </nav>
      <div className="mt-auto flex flex-col gap-3">
        {hasExampleData && (
          <div className="rounded-lg border border-line bg-canvas p-3">
            <span className="inline-flex rounded-xs border border-warn-line bg-warn-bg px-2 py-0.5 text-label font-medium text-warn-ink">
              Example data
            </span>
            <p className="mt-2 text-caption text-muted">
              Sample company data so you can try every flow. Reset everything to zero from the Overview.
            </p>
          </div>
        )}
        <SidebarAccount />
      </div>
    </aside>
  );
}

function SidebarItem({
  to,
  label,
  icon: Icon,
  end,
  trailing,
}: {
  to: string;
  label: string;
  icon: Icon;
  end?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `group flex h-10 items-center gap-3 rounded-md px-2.5 text-small font-medium transition-[background-color,color] duration-150 ${
            isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-canvas hover:text-brand-ink'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={20} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
            <span>{label}</span>
            {trailing}
          </>
        )}
      </NavLink>
    </li>
  );
}

function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[30px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm bg-brand shadow-button"
    >
      <span className="h-[3px] w-[10px] rounded-[1.5px] bg-surface" />
      <span className="h-[3px] w-[14px] rounded-[1.5px] bg-surface" />
    </span>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[19px] font-bold tracking-[-0.02em] text-brand">
        subscribio<span aria-hidden="true" className="text-brand-accent">.</span>
      </span>
    </span>
  );
}

/** Phone header (below lg): logo, the example-data label and "Sign out". */
export function Header() {
  const { hasExampleData } = useStore();
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:hidden">
      <div className="flex h-header items-center gap-2 px-gutter">
        <Logo />
        <span className="flex-1" />
        {hasExampleData && (
          <span className="rounded-xs border border-warn-line bg-warn-bg px-2 py-0.5 text-label font-medium text-warn-ink">
            Example data
          </span>
        )}
        <HeaderAccount />
      </div>
    </header>
  );
}

/** Phone tab bar (below lg). */
export function TabBar({ activeTab }: { activeTab?: 'overview' | 'employees' }) {
  const { pendingRequestCount } = useStore();
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-1/2 z-10 w-full max-w-app -translate-x-1/2 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:hidden"
    >
      <ul className="flex h-tabbar">
        <Tab to="/" end label="Overview" active={activeTab === 'overview'} icon={SquaresFour} />
        <Tab to="/employees" label="Employees" active={activeTab === 'employees'} icon={UsersThree} />
        <Tab
          to="/requests"
          label="Requests"
          icon={ClipboardText}
          count={pendingRequestCount}
          srExtra={pendingRequestCount > 0 ? `, ${pendingRequestCount} pending` : undefined}
        />
      </ul>
    </nav>
  );
}

function Tab({
  to,
  label,
  icon: Icon,
  end,
  srExtra,
  active,
  count = 0,
}: {
  to: string;
  label: string;
  icon: Icon;
  end?: boolean;
  srExtra?: string;
  active?: boolean;
  count?: number;
}) {
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex h-full flex-col items-center justify-center gap-1 text-[12px] transition-[color] duration-150 ${
            isActive || active ? 'font-semibold text-brand' : 'text-muted hover:text-brand-ink'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span aria-hidden="true" className="relative">
              <Icon size={24} weight={isActive || active ? 'fill' : 'regular'} />
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 flex size-[17px] items-center justify-center rounded-full border-[1.5px] border-surface bg-brand text-[10px] font-semibold text-surface">
                  {count}
                </span>
              )}
            </span>
            <span>
              {label}
              {srExtra && <span className="sr-only">{srExtra}</span>}
            </span>
          </>
        )}
      </NavLink>
    </li>
  );
}
