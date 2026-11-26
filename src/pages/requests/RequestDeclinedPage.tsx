import { Navigate, useParams } from 'react-router-dom';
import LinkButton from '../../components/ui/LinkButton';
import { ActionBar, RequestNotFound, StatusIcon, useRequest } from './parts';

// Frame 2.8 Request declined.
export default function RequestDeclinedPage() {
  const { requestId } = useParams();
  const { request, employee } = useRequest(requestId);
  if (!request) return <RequestNotFound />;
  if (request.status !== 'declined') return <Navigate to={`/requests/${request.id}`} replace />;

  return (
    <>
      <div className="flex flex-col gap-4 px-gutter pt-6 lg:max-w-2xl" role="status">
        <StatusIcon tone="declined" />
        <h1 className="text-title font-semibold text-brand-ink">Request declined</h1>
        <p className="text-body text-muted">
          {request.tool} for {employee?.name ?? 'your team member'} was declined. No purchase was
          made and spend is unchanged.
        </p>
        <div className="rounded-lg bg-brand-soft px-4 py-3">
          <p className="text-body text-brand">
            Changed your mind? The team member can send a new request any time.
          </p>
        </div>
      </div>
      <ActionBar>
        <LinkButton className="w-full" to="/requests">Back to requests</LinkButton>
      </ActionBar>
    </>
  );
}
