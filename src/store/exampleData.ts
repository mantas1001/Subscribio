import type { Employee, Subscription, ToolRequest } from '../types';

// EXAMPLE DATA, copied from the Figma frames. All names, emails and prices are invented.

// The prototype is set in early November 2026 (request on Nov 3, renewal on Nov 21).
// "Upcoming renewals" is measured from this fixed date so the app always matches
// frames 1.1, 1.2 and 1.3, whatever day it is opened.
export const REFERENCE_DATE = '2026-11-05';

export type AppState = {
  subscriptions: Subscription[];
  employees: Employee[];
  requests: ToolRequest[];
};

export const exampleData: AppState = {
  subscriptions: [
    {
      id: 'sub-ahrefs',
      tool: 'Ahrefs',
      plan: 'Standard',
      seats: 1,
      monthlyCostEur: 99,
      renewalDate: '2026-11-21',
      status: 'active',
    },
  ],
  employees: [
    {
      id: 'emp-drew',
      name: 'Drew Cooper',
      email: 'drew.cooper@example.com',
      role: 'Marketing',
      subscriptionIds: ['sub-ahrefs'],
    },
  ],
  requests: [
    {
      id: 'req-chatgpt',
      employeeId: 'emp-drew',
      tool: 'ChatGPT Team',
      monthlyCostEur: 30,
      reason: 'Draft campaign copy and summarize customer research faster.',
      status: 'pending',
      requestedAt: '2026-11-03',
    },
  ],
};
