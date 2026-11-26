import { useEffect, useRef, useState } from 'react';

// Short "Saving…" state so every action shows feedback, like a real app talking to a server.
// There is no backend: the action itself runs instantly after the delay.
export function useSaving(delayMs = 450) {
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = (action: () => void) => {
    if (saving) return;
    setSaving(true);
    timer.current = window.setTimeout(() => {
      setSaving(false);
      action();
    }, delayMs);
  };
  return { saving, run };
}
