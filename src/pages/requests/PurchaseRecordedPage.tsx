import { Navigate, useParams } from 'react-router-dom';
import { formatEur, formatLongDate, useStore } from '../../store';
import { ActionBar, DetailTable, LocalLinkButton, RequestNotFound, StatusIcon, useRequest } from './parts';

// Frame 2.6 Purchase recorded. "New monthly total" is read live from the store.
export default function PurchaseRecordedPage() {
  const { requestId } = useParams();
  const { request, employee } = useRequest(requestId);
  const { subscriptions, monthlySpend } = useStore();
  if (!request) return <RequestNotFound />;
  if (request.status !== 'purchased') return <Navigate to={`/requests/${request.id}`} replace />;

  const subscription = subscriptions.find((s) => s.id === `sub-${request.id}`);

  return (
    <>
      <div className="flex flex-col gap-4 px-gutter pt-6" role="status">
        <StatusIcon tone="success" />
        <h1 className="text-title font-semibold text-brand-ink">Purchase recorded</h1>
        <p className="text-body text-muted">
          {request.tool} is now active for {employee?.name ?? 'your team member'}.
        </p>
        <DetailTable
          rows={[
            ['Status', subscription?.status === 'cancelled' ? 'Cancelled' : 'Active'],
            ['Added to spend', `${formatEur(subscription?.monthlyCostEur ?? request.monthlyCostEur)} / month`],
            ['New monthly total', formatEur(monthlySpend)],
            ['Next renewal', subscription ? formatLongDate(subscription.renewalDate) : '—'],
          ]}
        />
      </div>
      <ActionBar>
        <LocalLinkButton to="/">Back to overview</LocalLinkButton>
        <LocalLinkButton to="/requests" variant="secondary">
          See requests
        </LocalLinkButton>
      </ActionBar>
    </>
  );
}
