import type { Subscription } from '../types';
import { exampleData, REFERENCE_DATE, type AppState } from './exampleData';
import { addMonths } from './format';

export type Action =
  | { type: 'approveRequest'; id: string }
  | { type: 'declineRequest'; id: string }
  | { type: 'recordPurchase'; id: string; amountEur?: number; purchaseDate?: string }
  | { type: 'cancelSubscription'; id: string }
  | { type: 'addEmployee'; name: string; email: string; id: string }
  | { type: 'reset' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'approveRequest':
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id && r.status === 'pending' ? { ...r, status: 'approved' } : r,
        ),
      };

    case 'declineRequest':
      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id && r.status === 'pending' ? { ...r, status: 'declined' } : r,
        ),
      };

    case 'recordPurchase': {
      const request = state.requests.find((r) => r.id === action.id);
      if (!request || request.status !== 'approved') return state;
      const subscription: Subscription = {
        id: `sub-${request.id}`,
        tool: request.tool,
        seats: 1,
        monthlyCostEur: action.amountEur ?? request.monthlyCostEur,
        renewalDate: addMonths(action.purchaseDate ?? REFERENCE_DATE, 1),
        status: 'active',
      };
      return {
        subscriptions: [...state.subscriptions, subscription],
        employees: state.employees.map((e) =>
          e.id === request.employeeId
            ? { ...e, subscriptionIds: [...e.subscriptionIds, subscription.id] }
            : e,
        ),
        requests: state.requests.map((r) =>
          r.id === request.id ? { ...r, status: 'purchased' } : r,
        ),
      };
    }

    case 'cancelSubscription':
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.id ? { ...s, status: 'cancelled' } : s,
        ),
      };

    case 'addEmployee':
      return {
        ...state,
        employees: [
          ...state.employees,
          { id: action.id, name: action.name, email: action.email, subscriptionIds: [] },
        ],
      };

    case 'reset':
      return structuredClone(exampleData);
  }
}
