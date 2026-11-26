import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { Employee } from '../types';
import { exampleData, REFERENCE_DATE, type AppState } from './exampleData';
import { reducer } from './reducer';
import { daysBetween } from './format';

export { REFERENCE_DATE, DEPARTMENT_OPTIONS } from './exampleData';
export type { AppState } from './exampleData';
export * from './format';

const STORAGE_KEY = 'subscribio-state-v1';

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

export type Store = AppState & {
  // actions
  approveRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  /** Optional details from the "Record the purchase" sheet; defaults to the requested cost. */
  recordPurchase: (id: string, details?: { amountEur?: number; purchaseDate?: string }) => void;
  cancelSubscription: (id: string) => void;
  addEmployee: (input: AddEmployeeInput) => AddEmployeeResult;
  resetExampleData: () => void;
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or blocked: the app still works for this visit
    }
  }, [state]);

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
      const employee: Employee = {
        id,
        name: cleanName,
        email: cleanEmail,
        ...(cleanRole ? { role: cleanRole } : {}),
        subscriptionIds: [],
      };
      return { ok: true, employee };
    },
    [state.employees],
  );

  const value = useMemo<Store>(() => {
    const active = state.subscriptions.filter((s) => s.status === 'active');
    const pending = state.requests.filter((r) => r.status === 'pending');
    const monthlySpend = active.reduce((sum, s) => sum + s.monthlyCostEur, 0);
    const departments = new Set(state.employees.map((e) => e.role).filter(Boolean));
    return {
      ...state,
      approveRequest: (id) => dispatch({ type: 'approveRequest', id }),
      declineRequest: (id) => dispatch({ type: 'declineRequest', id }),
      recordPurchase: (id, details) => dispatch({ type: 'recordPurchase', id, ...details }),
      cancelSubscription: (id) => dispatch({ type: 'cancelSubscription', id }),
      addEmployee,
      resetExampleData: () => dispatch({ type: 'reset' }),
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
  }, [state, addEmployee]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>.');
  return store;
}
