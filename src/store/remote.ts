import type { SupabaseClient } from '@supabase/supabase-js';
import type { Employee, Subscription, ToolRequest } from '../types';
import type { AppState } from './exampleData';

// Shared workspace in Supabase (see supabase/migrations/0001_shared_workspace.sql).
// Reads go straight to the tables (RLS lets members read). Every change is an RPC call to a
// database function that checks the caller, makes the change and writes the activity log.

export type Member = {
  user_id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member';
  blocked: boolean;
  first_seen: string;
  last_seen: string;
};

/** Error from Supabase, with a message a person can read. */
export class RemoteError extends Error {}

const FRIENDLY: Record<string, string> = {
  no_access: 'Your access to this workspace has been removed.',
  admin_only: 'Only an admin can do that.',
  duplicate_email: 'Someone on your team already uses this email.',
  request_not_pending: 'Someone else already handled this request.',
  request_not_approved: 'This request is no longer waiting for a purchase.',
  subscription_not_active: 'This subscription was already cancelled.',
  employee_not_found: 'That team member no longer exists.',
  cannot_change_self: 'You can’t change your own access.',
  member_not_found: 'That person is no longer a member.',
};

function toRemoteError(error: { message: string }) {
  const key = Object.keys(FRIENDLY).find((k) => error.message.includes(k));
  return new RemoteError(key ? FRIENDLY[key] : 'Couldn’t save that change. Check your connection and try again.');
}

export async function joinWorkspace(client: SupabaseClient): Promise<Member> {
  const { data, error } = await client.rpc('join_workspace');
  if (error) throw toRemoteError(error);
  return data as Member;
}

type EmployeeRow = { id: string; name: string; email: string; role: string | null };
type SubscriptionRow = {
  id: string;
  tool: string;
  plan: string | null;
  seats: number;
  monthly_cost_eur: number | string;
  renewal_date: string;
  status: Subscription['status'];
  employee_id: string | null;
};
type RequestRow = {
  id: string;
  employee_id: string;
  tool: string;
  monthly_cost_eur: number | string;
  reason: string | null;
  status: ToolRequest['status'];
  requested_at: string | null;
};

/** Turns table rows into the app's AppState shape (employees carry their subscription ids). */
export function rowsToState(
  employeeRows: EmployeeRow[],
  subscriptionRows: SubscriptionRow[],
  requestRows: RequestRow[],
): AppState {
  const subscriptions: Subscription[] = subscriptionRows.map((s) => ({
    id: s.id,
    tool: s.tool,
    ...(s.plan ? { plan: s.plan } : {}),
    seats: s.seats,
    monthlyCostEur: Number(s.monthly_cost_eur),
    renewalDate: s.renewal_date,
    status: s.status,
  }));
  const employees: Employee[] = employeeRows.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    ...(e.role ? { role: e.role } : {}),
    subscriptionIds: subscriptionRows.filter((s) => s.employee_id === e.id).map((s) => s.id),
  }));
  const requests: ToolRequest[] = requestRows.map((r) => ({
    id: r.id,
    employeeId: r.employee_id,
    tool: r.tool,
    monthlyCostEur: Number(r.monthly_cost_eur),
    ...(r.reason ? { reason: r.reason } : {}),
    status: r.status,
    ...(r.requested_at ? { requestedAt: r.requested_at } : {}),
  }));
  return { subscriptions, employees, requests };
}

export async function fetchWorkspace(client: SupabaseClient): Promise<AppState> {
  const [employees, subscriptions, requests] = await Promise.all([
    client.from('employees').select('id,name,email,role').order('created_at'),
    client
      .from('subscriptions')
      .select('id,tool,plan,seats,monthly_cost_eur,renewal_date,status,employee_id')
      .order('created_at'),
    client
      .from('requests')
      .select('id,employee_id,tool,monthly_cost_eur,reason,status,requested_at')
      .order('created_at'),
  ]);
  const failed = employees.error ?? subscriptions.error ?? requests.error;
  if (failed) throw toRemoteError(failed);
  return rowsToState(
    (employees.data ?? []) as EmployeeRow[],
    (subscriptions.data ?? []) as SubscriptionRow[],
    (requests.data ?? []) as RequestRow[],
  );
}

export async function callAction(client: SupabaseClient, fn: string, args?: Record<string, unknown>) {
  const { error } = await client.rpc(fn, args);
  if (error) throw toRemoteError(error);
}


