import { daysBetween, formatEur, formatEurShort, formatLongDate, formatShortDate, REFERENCE_DATE } from '../../store';
import type { Employee, Subscription } from '../../types';

export type RoleBData = {
  employees: readonly Employee[];
  subscriptions: readonly Subscription[];
};

export type LoadState = {
  loading?: boolean;
  error?: string;
};

export const money = formatEur;
export const compactMoney = formatEurShort;

export const toolName = (subscription: Subscription) => subscription.tool.split(' · ')[0];

export function activeTools(employee: Employee, subscriptions: readonly Subscription[]) {
  const assigned = new Set(employee.subscriptionIds);
  return subscriptions.filter(subscription => assigned.has(subscription.id) && subscription.status === 'active');
}

export function monthlyTotal(subscriptions: readonly Subscription[]) {
  return subscriptions.reduce((cents, subscription) => subscription.status === 'active'
    ? cents + Math.round(subscription.monthlyCostEur * 100) : cents, 0) / 100;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? `${parts[0][0]}${parts.length > 1 ? parts.at(-1)![0] : ''}`.toUpperCase() : '?';
}

export function displayDate(isoDate: string, includeYear = false) {
  return includeYear ? formatLongDate(isoDate) : formatShortDate(isoDate);
}

export function renewalLabel(isoDate: string) {
  const days = daysBetween(REFERENCE_DATE, isoDate);
  if (days < 0) return `Renewal date: ${displayDate(isoDate)}`;
  return days === 0 ? 'Renews today' : `Renews in ${days} ${days === 1 ? 'day' : 'days'}`;
}

export const employeePath = (id: string) => `/employees/${encodeURIComponent(id)}`;
export const subscriptionPath = (id: string) => `/subscriptions/${encodeURIComponent(id)}`;
