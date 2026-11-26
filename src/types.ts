// Shared contract. All three roles code against these types.
// Owner: Role A. Ask before changing a field.

export type Subscription = {
  id: string;
  tool: string;
  seats: number;
  monthlyCostEur: number;
  renewalDate: string; // ISO date
  status: 'active' | 'cancelled';
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  role?: string; // shown as the department, e.g. "Marketing"
  subscriptionIds: string[];
};

export type ToolRequest = {
  id: string;
  employeeId: string;
  tool: string;
  monthlyCostEur: number;
  reason?: string;
  status: 'pending' | 'approved' | 'purchased' | 'declined';
  requestedAt?: string; // ISO date (extra, optional: frames show "Requested Nov 3")
};
