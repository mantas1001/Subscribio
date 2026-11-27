import { useSyncExternalStore } from 'react';

// Microsoft Clarity (heatmaps and session recordings), loaded only after the visitor agrees.
//
// - Turned on by the VITE_CLARITY_ID environment variable (the project ID from clarity.microsoft.com,
//   Settings → Overview). Without it nothing is shown and nothing loads, e.g. in local development.
// - Always off in the browser-test builds (`--mode e2e` and `auth-test`).
// - EU rules (GDPR / ePrivacy): Clarity sets cookies and records sessions, so it needs consent first.
//   The choice is stored in this browser and can be changed any time ("Privacy settings").
//   After "Allow" we also send Clarity's consent signal (consentv2), which Microsoft requires
//   for visitors in the EEA, UK and Switzerland.

const CLARITY_ID = import.meta.env.VITE_CLARITY_ID?.trim() ?? '';
const TEST_BUILD = import.meta.env.MODE === 'e2e' || import.meta.env.MODE === 'auth-test';
const STORAGE_KEY = 'subscribio-analytics-consent';

/** True when Clarity is configured for this build (so the consent banner is relevant). */
export const analyticsAvailable = /^[a-z0-9]{6,20}$/i.test(CLARITY_ID) && !TEST_BUILD;

export type Consent = 'granted' | 'denied' | null;

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

function readConsent(): Consent {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

let consent: Consent = readConsent();
const listeners = new Set<() => void>();
let loaded = false;

/** Injects the official Clarity loader once. */
function loadClarity() {
  if (loaded || !analyticsAvailable) return;
  loaded = true;
  // Same as Microsoft's snippet: queue calls until the real script arrives.
  const queue: ClarityFn = (...args: unknown[]) => {
    (queue.q = queue.q || []).push(args);
  };
  window.clarity = window.clarity || queue;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_ID)}`;
  document.head.appendChild(script);
  // Consent signal for EEA/UK/CH visitors: analytics allowed, no advertising use.
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
}

/** Saves the visitor's choice. "denied" after "granted" also tells Clarity to stop and clear its cookies. */
export function setConsent(value: 'granted' | 'denied') {
  consent = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // storage blocked: the choice still applies for this visit
  }
  if (value === 'granted') {
    loadClarity();
  } else if (loaded && window.clarity) {
    // Withdrawn: Clarity erases its cookies and stops tracking.
    window.clarity('consent', false);
  }
  listeners.forEach((listener) => listener());
}

/** Shows the consent banner again (from "Privacy settings"). */
export function reopenConsent() {
  consent = null;
  listeners.forEach((listener) => listener());
}

/** Starts Clarity on page load when the visitor agreed on an earlier visit. */
export function initAnalytics() {
  if (consent === 'granted') loadClarity();
}

/** Tags the current screen, so recordings can be filtered by screen in Clarity. */
export function tagScreen(screen: string) {
  if (loaded && window.clarity) window.clarity('set', 'screen', screen);
}

export function useConsent(): Consent {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => consent,
    () => null,
  );
}
