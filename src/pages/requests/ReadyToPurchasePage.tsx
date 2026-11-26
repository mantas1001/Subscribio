import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { REFERENCE_DATE, formatEur, useStore } from '../../store';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { ActionBar, RequestNotFound, Sheet, ToolTile, useRequest } from './parts';
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
        <Card className="flex flex-col gap-3">
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
            <Badge tone="success">Approved</Badge>
            <span className="text-caption text-muted">Approved today</span>
          </div>
        </Card>
      </div>

      <ActionBar aboveTabBar>
        <Button className="w-full" onClick={() => setSheetOpen(true)}>
          Record purchase
        </Button>
      </ActionBar>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Record the purchase"
        description={`Confirm you bought ${request.tool} for ${employee?.name ?? 'your team member'}. It becomes active and counts toward monthly spend.`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Input
              id="purchase-date"
              label="Purchase date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            {/* Frame 2.5a: empty amount shows the error under the field, on a light red fill. */}
            <Input
              id="amount-paid"
              label="Amount paid (€)"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              error={error ?? undefined}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              className={`w-full ${error ? '!bg-danger-soft' : ''}`}
            />
          </div>
        </div>
        <Button className="w-full" disabled={saving.saving} onClick={confirm}>
          {saving.saving ? 'Saving…' : 'Confirm purchase'}
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => setSheetOpen(false)}>
          Not yet
        </Button>
      </Sheet>
    </>
  );
}
