import { Button, ErrorMessage } from '../employees/RoleBControls';
import { useEffect, useRef, useState } from 'react';
import type { Subscription } from '../../types';
import { Details } from '../employees/RoleBLayout';
import { displayDate, money, toolName } from '../employees/roleBModels';

export type CancelSubscriptionDialogProps = {
  subscription: Subscription;
  ownerNames: string;
  monthlySpend: number;
  onDismiss: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function CancelSubscriptionDialog({ subscription, ownerNames, monthlySpend,
  onDismiss, onConfirm }: CancelSubscriptionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const dialog = dialogRef.current!;
    const previouslyFocused = document.activeElement;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[data-initial-focus]')?.focus();
    return () => {
      dialog.close();
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
    };
  }, []);

  async function confirm() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch {
      setError('The subscription could not be cancelled. Your spending has not changed. Please try again.');
      inFlight.current = false;
      setBusy(false);
    }
  }
  const after = Math.max(0, Math.round((monthlySpend - subscription.monthlyCostEur) * 100) / 100);
  return (
    <dialog ref={dialogRef} className="rb-cancel-dialog" aria-labelledby="rb-cancel-title"
      aria-describedby="rb-cancel-consequence" aria-busy={busy}
      onCancel={event => { event.preventDefault(); if (!inFlight.current) onDismiss(); }}>
      <div className="rb-sheet-handle" aria-hidden="true" />
      <h2 id="rb-cancel-title">Cancel {toolName(subscription)}{ownerNames && ` for ${ownerNames}`}?</h2>
      <p className="rb-muted" id="rb-cancel-consequence">
        Access stays available until {displayDate(subscription.renewalDate)}. It will not renew,
        and monthly spend drops by {money(subscription.monthlyCostEur)}.
      </p>
      <Details rows={[
        ['Monthly spend', <span key="spend" aria-label={`${money(monthlySpend)} changes to ${money(after)}`}>
          {money(monthlySpend)} <span aria-hidden="true"> → </span>{money(after)}</span>],
        ['Access ends', displayDate(subscription.renewalDate, true)],
      ]} />
      {error && <ErrorMessage message={error} />}
      <Button variant="danger" className="rb-full-width" disabled={busy} onClick={confirm}>
        {busy ? 'Cancelling…' : 'Cancel subscription'}
      </Button>
      <Button variant="secondary" className="rb-full-width" disabled={busy} data-initial-focus onClick={onDismiss}>
        Go back
      </Button>
    </dialog>
  );
}
