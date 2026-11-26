import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { REFERENCE_DATE, formatEur, useStore } from '../../store';
import {
  ActionBar,
  LocalBadge,
  LocalButton,
  RequestNotFound,
  Sheet,
  ToolTile,
  useRequest,
} from './parts';
import { useSaving } from './useSaving';

// Frame 2.4 Ready to purchase, with frames 2.5 "Confirm purchase" and
// 2.5a "Record purchase error" (empty amount) as a bottom sheet.
export default function ReadyToPurchasePage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { request, employee } = useRequest(requestId);
  const { recordPurchase } = useStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState(REFERENCE_DATE);
  const [amount, setAmount] = useState(request ? request.monthlyCostEur.toFixed(2) : '');
  const [error, setError] = useState<string | null>(null);
  const saving = useSaving();

  if (!request) return <RequestNotFound />;
  if (request.status === 'pending') return <Navigate to={`/requests/${request.id}`} replace />;
  if (request.status === 'purchased') return <Navigate to={`/requests/${request.id}/recorded`} replace />;
  if (request.status === 'declined') return <Navigate to={`/requests/${request.id}/declined`} replace />;

  const confirm = () => {
    const value = Number(amount.replace(',', '.').replace(/[€\s]/g, ''));
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError('Enter the amount you paid.');
      return;
    }
    setError(null);
    saving.run(() => {
      setSheetOpen(false);
      navigate(`/requests/${request.id}/recorded`);
      recordPurchase(request.id, { amountEur: value, purchaseDate: purchaseDate || REFERENCE_DATE });
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4 px-gutter pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-title font-semibold text-brand-ink">Ready to purchase</h1>
          <p className="text-body text-muted">
            Approved requests wait here until the purchase is recorded.
          </p>
        </div>
        <div className="rounded-lg border border-warn-line bg-warn-bg px-4 py-3">
          <p className="text-body text-warn-ink">
            Buy it with your company card first, then record the purchase here.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <ToolTile tool={request.tool} />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-base font-semibold text-brand-ink">{request.tool}</span>
              <span className="text-small text-muted">
                {employee?.name}
                {employee?.role ? ` · ${employee.role}` : ''}
              </span>
            </span>
            <span className="text-base font-semibold text-brand-ink">
              {formatEur(request.monthlyCostEur)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <LocalBadge tone="approved">Approved</LocalBadge>
            <span className="text-caption text-muted">Approved today</span>
          </div>
        </div>
      </div>

      <ActionBar aboveTabBar>
        <LocalButton onClick={() => setSheetOpen(true)}>Record purchase</LocalButton>
      </ActionBar>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Record the purchase"
        description={`Confirm you bought ${request.tool} for ${employee?.name ?? 'your team member'}. It becomes active and counts toward monthly spend.`}
      >
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="purchase-date" className="text-small font-medium text-brand-ink">
              Purchase date
            </label>
            <input
              id="purchase-date"
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="h-12 rounded-lg border border-line bg-surface px-3 text-base text-brand-ink"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="amount-paid" className="text-small font-medium text-brand-ink">
              Amount paid (€)
            </label>
            <input
              id="amount-paid"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'amount-error' : undefined}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              className={`h-12 rounded-lg border px-3 text-base text-brand-ink placeholder:text-muted ${
                error ? 'border-danger bg-danger-soft' : 'border-line bg-surface'
              }`}
            />
            {error && (
              <p id="amount-error" role="alert" className="text-caption text-danger">
                <span aria-hidden="true">⚠ </span>
                {error}
              </p>
            )}
          </div>
        </div>
        <LocalButton disabled={saving.saving} onClick={confirm}>
          {saving.saving ? 'Saving…' : 'Confirm purchase'}
        </LocalButton>
        <LocalButton variant="secondary" onClick={() => setSheetOpen(false)}>
          Not yet
        </LocalButton>
      </Sheet>
    </>
  );
}
