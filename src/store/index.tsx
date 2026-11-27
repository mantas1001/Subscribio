import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import type { Employee, Subscription } from '../types';
import { exampleData, REFERENCE_DATE, type AppState } from './exampleData';
import { reducer } from './reducer';
import { addMonths, daysBetween } from './format';
import { supabase } from '../auth/supabase';
import { callAction, fetchWorkspace, joinWorkspace, RemoteError, type Member } from './remote';
import WorkspaceStatus from '../components/layout/WorkspaceStatus';
import Toast from '../components/ui/Toast';

export { REFERENCE_DATE, DEPARTMENT_OPTIONS } from './exampleData';
export type { AppState } from './exampleData';
export * from './format';

const STORAGE_KEY = 'subscribio-state-v1';

/** Ids of the rows that come from the example data (plus the subscription a recorded example purchase creates). */
const EXAMPLE_IDS = new Set([
  ...exampleData.employees.map((e) => e.id),
  ...exampleData.subscriptions.map((s) => s.id),
  ...exampleData.requests.map((r) => r.id),
  ...exampleData.requests.map((r) => `sub-${r.id}`),
]);

export type AddEmployeeInput = {
  name: string;
  email: string;
  /** Department, e.g. "Engineering" (frame 5.1). Optional, so `{ name, email }` still works. */
  role?: string;
};

export type AddEmployeeResult =
  | { ok: true; employee: Employee }
  /** `existing` is set for a duplicate email, so the form can say who already uses it (frame 5.2). */
  | { ok: false; error: string; existing?: Employee };

export type AddSubscriptionInput = {
  tool: string;
  /** Optional plan name, e.g. "Standard" (shown as "Ahrefs · Standard"). */
  plan?: string;
  seats: number;
  monthlyCostEur: number;
  /** ISO date, e.g. "2026-12-21". */
  renewalDate: string;
  /** Who uses it. Every subscription belongs to a team member, as in the Figma frames. */
  employeeId: string;
};

export type AddSubscriptionField = 'tool' | 'seats' | 'monthlyCostEur' | 'renewalDate' | 'employeeId';

export type AddSubscriptionResult =
  | { ok: true; subscription: Subscription }
  | { ok: false; errors: Partial<Record<AddSubscriptionField, string>> };

/** Checks the input; returns an error message per field (empty object = valid). Pure, so it is easy to test. */
export function validateSubscription(
  input: AddSubscriptionInput,
  employees: Employee[],
): Partial<Record<AddSubscriptionField, string>> {
  const errors: Partial<Record<AddSubscriptionField, string>> = {};
  if (!input.tool.trim()) errors.tool = 'Enter the tool name.';
  else if (input.tool.trim().length > 60) errors.tool = 'Keep the tool name under 60 characters.';
  if (!Number.isInteger(input.seats) || input.seats < 1) errors.seats = 'Enter at least 1 seat.';
  else if (input.seats > 9999) errors.seats = 'Enter 9,999 seats or fewer.';
  if (!Number.isFinite(input.monthlyCostEur) || input.monthlyCostEur <= 0)
    errors.monthlyCostEur = 'Enter the monthly cost in euro, for example 29.00.';
  else if (input.monthlyCostEur > 1_000_000) errors.monthlyCostEur = 'Enter a cost under €1,000,000.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.renewalDate) || Number.isNaN(Date.parse(input.renewalDate)))
    errors.renewalDate = 'Choose the next renewal date.';
  if (!employees.some((e) => e.id === input.employeeId)) errors.employeeId = 'Choose who uses it.';
  return errors;
}

/**
 * Where the data lives:
 * - `shared`: one workspace in Supabase for everyone who signs in, with an activity log.
 * - `local`: this browser's localStorage only (tests, and local dev without Supabase keys).
 */
export type WorkspaceMode = 'local' | 'shared';

export type Store = AppState & {
  mode: WorkspaceMode;
  /** May reset or clear the workspace and manage team access. Always true in local mode. */
  isAdmin: boolean;
  /** The signed-in member (shared mode), else null. */
  member: Member | null;
  /** Goes up by one whenever anyone changes the shared workspace (the Activity page listens). */
  activityVersion: number;
  // actions
  approveRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  /** Optional details from the "Record the purchase" sheet; defaults to the requested cost. */
  recordPurchase: (id: string, details?: { amountEur?: number; purchaseDate?: string }) => void;
  cancelSubscription: (id: string) => void;
  addEmployee: (input: AddEmployeeInput) => AddEmployeeResult;
  addSubscription: (input: AddSubscriptionInput) => AddSubscriptionResult;
  /** Brings back the Figma example (Drew Cooper, Ahrefs, the ChatGPT request). Same as loadExampleData. */
  resetExampleData: () => void;
  /** Replaces everything with the Figma example data. */
  loadExampleData: () => void;
  /** Removes all employees, subscriptions and requests; every total becomes 0. */
  clearAllData: () => void;
  /** True while any of the example rows is still present (drives the "Example data" label). */
  hasExampleData: boolean;
  // derived values (always computed from state, never hard-coded)
  monthlySpend: number;
  annualizedSpend: number;
  activeSubscriptionCount: number;
  activeSeatCount: number;
  pendingRequestCount: number;
  pendingRequestedSpend: number;
  renewalsWithin30Days: AppState['subscriptions'];
  employeeCount: number;
  departmentCount: number;
};

const StoreContext = createContext<Store | null>(null);

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.subscriptions && parsed.employees && parsed.requests) return parsed;
    }
  } catch {
    // ignore broken or unavailable storage and fall back to example data
  }
  return structuredClone(exampleData);
}

const EMPTY_STATE: AppState = { subscriptions: [], employees: [], requests: [] };

type Phase = 'loading' | 'ready' | 'error' | 'blocked';

export function StoreProvider({ children }: { children: ReactNode }) {
  const shared = supabase !== null;
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    shared ? EMPTY_STATE : loadState(),
  );
  const [phase, setPhase] = useState<Phase>(shared ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);
  const [member, setMember] = useState<Member | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activityVersion, setActivityVersion] = useState(0);
  const isAdmin = !shared || (member?.role === 'admin' && !member.blocked);

  // Local mode: keep the workspace in this browser.
  useEffect(() => {
    if (shared) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or blocked: the app still works for this visit
    }
  }, [state, shared]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    dispatch({ type: 'replace', state: await fetchWorkspace(supabase) });
  }, []);

  // Shared mode: join the workspace (the first visit makes you a member), then load it.
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    setPhase('loading');
    (async () => {
      try {
        const me = await joinWorkspace(client);
        if (!active) return;
        setMember(me);
        if (me.blocked) {
          setPhase('blocked');
          return;
        }
        const next = await fetchWorkspace(client);
        if (!active) return;
        dispatch({ type: 'replace', state: next });
        setPhase('ready');
      } catch (error) {
        console.warn('Workspace load failed:', error);
        if (active) setPhase('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [attempt]);

  // Shared mode: when anyone changes something (a new activity row), reload. Also reload when
  // the tab comes back into view, in case the live connection dropped.
  useEffect(() => {
    if (!supabase || phase !== 'ready') return;
    const client = supabase;
    let timer: number | undefined;
    const reload = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        refresh().catch((error) => console.warn('Workspace refresh failed:', error));
        setActivityVersion((v) => v + 1);
      }, 250);
    };
    const channel = client
      .channel('workspace-activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity' }, reload)
      .subscribe();
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      void client.removeChannel(channel);
    };
  }, [phase, refresh]);

  /** Shared mode: send a change that is already on screen. If it fails, say so and reload. */
  const sync = useCallback(
    (fn: string, args?: Record<string, unknown>) => {
      if (!supabase) return;
      callAction(supabase, fn, args).catch((error) => {
        setSyncError(error instanceof RemoteError ? error.message : 'Couldn’t save that change.');
        refresh().catch(() => {});
      });
    },
    [refresh],
  );

  const addEmployee = useCallback(
    ({ name, email, role }: AddEmployeeInput): AddEmployeeResult => {
      const cleanName = name.trim();
      const cleanEmail = email.trim();
      const cleanRole = role?.trim() || undefined;
      if (!cleanName) return { ok: false, error: 'Enter a name.' };
      if (!cleanEmail) return { ok: false, error: 'Enter an email address.' };
      const existing = state.employees.find(
        (e) => e.email.toLowerCase() === cleanEmail.toLowerCase(),
      );
      if (existing) {
        return { ok: false, error: 'Someone on your team already uses this email.', existing };
      }
      const id = `emp-${Date.now().toString(36)}`;
      dispatch({ type: 'addEmployee', id, name: cleanName, email: cleanEmail, role: cleanRole });
      sync('add_employee', { p_id: id, p_name: cleanName, p_email: cleanEmail, p_role: cleanRole ?? null });
      const employee: Employee = {
        id,
        name: cleanName,
        email: cleanEmail,
        ...(cleanRole ? { role: cleanRole } : {}),
        subscriptionIds: [],
      };
      return { ok: true, employee };
    },
    [state.employees, sync],
  );

  const addSubscription = useCallback(
    (input: AddSubscriptionInput): AddSubscriptionResult => {
      const errors = validateSubscription(input, state.employees);
      if (Object.keys(errors).length > 0) return { ok: false, errors };
      const plan = input.plan?.trim();
      const subscription: Subscription = {
        id: `sub-${Date.now().toString(36)}`,
        tool: input.tool.trim(),
        ...(plan ? { plan } : {}),
        seats: input.seats,
        monthlyCostEur: Math.round(input.monthlyCostEur * 100) / 100,
        renewalDate: input.renewalDate,
        status: 'active',
      };
      dispatch({ type: 'addSubscription', subscription, employeeId: input.employeeId });
      sync('add_subscription', {
        p_id: subscription.id,
        p_tool: subscription.tool,
        p_plan: plan || null,
        p_seats: subscription.seats,
        p_monthly_cost_eur: subscription.monthlyCostEur,
        p_renewal_date: subscription.renewalDate,
        p_employee_id: input.employeeId,
      });
      return { ok: true, subscription };
    },
    [state.employees, sync],
  );

  const value = useMemo<Store>(() => {
    const active = state.subscriptions.filter((s) => s.status === 'active');
    const pending = state.requests.filter((r) => r.status === 'pending');
    const monthlySpend = active.reduce((sum, s) => sum + s.monthlyCostEur, 0);
    const departments = new Set(state.employees.map((e) => e.role).filter(Boolean));
    const loadExample = () => {
      if (!isAdmin) return;
      dispatch({ type: 'reset' });
      sync('load_example_data');
    };
    return {
      ...state,
      mode: shared ? 'shared' : 'local',
      isAdmin,
      member,
      activityVersion,
      approveRequest: (id) => {
        dispatch({ type: 'approveRequest', id });
        sync('approve_request', { p_id: id });
      },
      declineRequest: (id) => {
        dispatch({ type: 'declineRequest', id });
        sync('decline_request', { p_id: id });
      },
      recordPurchase: (id, details) => {
        const request = state.requests.find((r) => r.id === id);
        if (!request || request.status !== 'approved') return;
        dispatch({ type: 'recordPurchase', id, ...details });
        sync('record_purchase', {
          p_id: id,
          p_amount_eur: details?.amountEur ?? null,
          p_renewal_date: addMonths(details?.purchaseDate ?? REFERENCE_DATE, 1),
        });
      },
      cancelSubscription: (id) => {
        dispatch({ type: 'cancelSubscription', id });
        sync('cancel_subscription', { p_id: id });
      },
      addEmployee,
      addSubscription,
      resetExampleData: loadExample,
      loadExampleData: loadExample,
      clearAllData: () => {
        if (!isAdmin) return;
        dispatch({ type: 'clear' });
        sync('clear_all_data');
      },
      hasExampleData:
        state.employees.some((e) => EXAMPLE_IDS.has(e.id)) ||
        state.subscriptions.some((s) => EXAMPLE_IDS.has(s.id)) ||
        state.requests.some((r) => EXAMPLE_IDS.has(r.id)),
      monthlySpend,
      annualizedSpend: monthlySpend * 12,
      activeSubscriptionCount: active.length,
      activeSeatCount: active.reduce((sum, s) => sum + s.seats, 0),
      pendingRequestCount: pending.length,
      pendingRequestedSpend: pending.reduce((sum, r) => sum + r.monthlyCostEur, 0),
      renewalsWithin30Days: active
        .filter((s) => {
          const days = daysBetween(REFERENCE_DATE, s.renewalDate);
          return days >= 0 && days < 30;
        })
        .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate)),
      employeeCount: state.employees.length,
      departmentCount: departments.size,
    };
  }, [state, addEmployee, addSubscription, sync, shared, isAdmin, member, activityVersion]);

  if (phase !== 'ready') {
    return <WorkspaceStatus phase={phase} onRetry={() => setAttempt((n) => n + 1)} />;
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
      {syncError && (
        <div className="fixed inset-x-0 bottom-[calc(theme(spacing.tabbar)+16px)] z-30 mx-auto w-full max-w-app px-gutter lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0 lg:max-w-sm lg:px-0">
          <Toast
            variant="error"
            title="Not saved"
            message={`${syncError} The page now shows the latest saved data.`}
            onDismiss={() => setSyncError(null)}
            className="shadow-overlay"
          />
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>.');
  return store;
}
