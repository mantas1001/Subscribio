import { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { formatEur, formatEurShort, formatLongDate, useStore } from '../../store';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import TopBar from '../../components/ui/TopBar';
import {
  ActionBar,
  DetailTable,
  RequestNotFound,
  Sheet,
  ToolTile,
  declineButtonClass,
  useRequest,
} from './parts';
import { useSaving } from './useSaving';

// Frame 2.2 Request detail, with frame 2.7 "Confirm decline" as a bottom sheet.
export default function RequestDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { request, employee } = useRequest(requestId);
  const { monthlySpend, approveRequest, declineRequest } = useStore();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [note, setNote] = useState('');
  const approving = useSaving();
  const declining = useSaving();
  // Status when the page was opened. Approving here must show frame 2.3, so only a
  // request that was already approved on arrival is sent on to the purchase step.
  const statusOnOpen = useRef(request?.status);

  if (!request) return <RequestNotFound />;
  if (request.status === 'approved') {
    return statusOnOpen.current === 'approved' ? (
      <Navigate to={`/requests/${request.id}/purchase`} replace />
    ) : (
      <Navigate to={`/requests/${request.id}/approved`} replace />
    );
  }
  if (request.status === 'purchased') return <Navigate to={`/requests/${request.id}/recorded`} replace />;
  if (request.status === 'declined') return <Navigate to={`/requests/${request.id}/declined`} replace />;

  const busy = approving.saving || declining.saving;

  return (
    <>
      <TopBar title="Request" onBack={() => navigate('/requests')} />
      <div className="flex flex-col gap-4 px-gutter pt-5">
        <p className="text-eyebrow font-medium uppercase text-brand-accent-text">Request review</p>
        <div className="flex items-center gap-3">
          <ToolTile tool={request.tool} size="lg" />
          <div className="flex flex-col items-start gap-1">
            <h2 className="text-[24px] font-semibold text-brand-ink">{request.tool}</h2>
            <Badge tone="warn">Pending review</Badge>
          </div>
        </div>

        <DetailTable
          rows={[
            ['Employee', employee?.name ?? 'Unknown'],
            ['Department', employee?.role ?? '—'],
            ['Cost', `${formatEur(request.monthlyCostEur)} / month`],
            [
              'Spend if approved',
              `${formatEur(monthlySpend + request.monthlyCostEur)} / month  (+${formatEurShort(request.monthlyCostEur)})`,
            ],
            ['Requested', request.requestedAt ? formatLongDate(request.requestedAt) : '—'],
          ]}
        />

        {request.reason && (
          <Card className="flex flex-col gap-1">
            <p className="text-eyebrow font-medium uppercase text-brand-accent-text">Why they need it</p>
            <p className="text-base text-brand-ink">{request.reason}</p>
          </Card>
        )}

        <div className="rounded-lg border border-line bg-brand-soft px-4 py-3.5">
          <p className="text-body font-medium text-brand">
            Approving does not buy the tool. You record the purchase afterwards.
          </p>
        </div>
      </div>

      <ActionBar>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className={declineButtonClass}
            disabled={busy}
            onClick={() => setDeclineOpen(true)}
          >
            Decline
          </Button>
          <Button
            className="w-full"
            disabled={busy}
            aria-live="polite"
            onClick={() =>
              approving.run(() => {
                approveRequest(request.id);
                navigate(`/requests/${request.id}/approved`);
              })
            }
          >
            {approving.saving ? 'Approving…' : 'Approve'}
          </Button>
        </div>
      </ActionBar>

      <Sheet
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline this request?"
        description={`${employee?.name ?? 'This team member'} will not get this tool. Nothing is purchased.`}
      >
        <label htmlFor="decline-note" className="text-small font-medium text-brand-ink">
          Reason (optional)
        </label>
        <textarea
          id="decline-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="For example: Let’s revisit next quarter."
          className="rounded-lg border border-line bg-surface px-3 py-3 text-base text-brand-ink placeholder:text-muted"
        />
        <Button
          variant="danger"
          className="w-full"
          disabled={declining.saving}
          onClick={() =>
            declining.run(() => {
              setDeclineOpen(false);
              navigate(`/requests/${request.id}/declined`);
              declineRequest(request.id);
            })
          }
        >
          {declining.saving ? 'Declining…' : 'Decline request'}
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => setDeclineOpen(false)}>
          Keep reviewing
        </Button>
      </Sheet>
    </>
  );
}
