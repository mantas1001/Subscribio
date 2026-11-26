import { useParams } from 'react-router-dom';
import { formatEur } from '../../store';
import {
  ActionBar,
  LocalBadge,
  LocalLinkButton,
  RequestNotFound,
  StatusIcon,
  ToolTile,
  useRequest,
} from './parts';

// Frame 2.3 Request approved.
// Open issue (team decision pending): 3 of 5 test participants stopped here without
// recording the purchase. Built exactly like Figma for now.
export default function RequestApprovedPage() {
  const { requestId } = useParams();
  const { request, employee } = useRequest(requestId);
  if (!request) return <RequestNotFound />;

  return (
    <>
      <div className="flex flex-col gap-4 px-gutter pt-6" role="status">
        <StatusIcon tone="success" />
        <h1 className="text-title font-semibold text-brand-ink">Request approved</h1>
        <p className="text-body text-muted">
          {request.tool} for {employee?.name ?? 'your team member'} is approved. Next, buy it and
          record the purchase.
        </p>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
          <ToolTile tool={request.tool} />
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-base font-semibold text-brand-ink">{request.tool}</span>
            <span className="text-small text-muted">{formatEur(request.monthlyCostEur)} /month</span>
          </span>
          <LocalBadge tone="approved">Approved</LocalBadge>
        </div>
        <p className="text-caption text-muted">Spend will not change until the purchase is recorded.</p>
      </div>
      <ActionBar>
        <LocalLinkButton to={`/requests/${request.id}/purchase`}>Go to purchase</LocalLinkButton>
        <LocalLinkButton to="/requests" variant="secondary">
          Back to requests
        </LocalLinkButton>
      </ActionBar>
    </>
  );
}
