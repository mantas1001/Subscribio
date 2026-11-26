import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';
import RoleBLayout, { Details, SuccessMark } from '../employees/RoleBLayout';
import { displayDate, money, toolName, type RoleBData } from '../employees/roleBModels';
import SubscriptionCancelledPage from './SubscriptionCancelledPage';

export type SubscriptionKeptPageProps = RoleBData & { subscriptionId: string };

export default function SubscriptionKeptPage({ subscriptionId, employees, subscriptions }: SubscriptionKeptPageProps) {
  const navigate = useNavigate();
  const subscription = subscriptions.find(item => item.id === subscriptionId);
  if (subscription?.status === 'cancelled') return (
    <SubscriptionCancelledPage subscriptionId={subscriptionId} employees={employees} subscriptions={subscriptions} />
  );
  const names = employees.filter(employee => employee.subscriptionIds.includes(subscriptionId))
    .map(employee => employee.name).join(', ');
  return (
    <RoleBLayout tabs={false} singleAction footer={
      <Button variant="primary" className="rb-full-width" onClick={() => navigate('/')}>Back to overview</Button>
    }>
      {subscription ? <div className="rb-result">
        <SuccessMark />
        <h1>Kept for now</h1>
        <p className="rb-muted">{toolName(subscription)} stays active{names && ` for ${names}`} and renews on{' '}
          {displayDate(subscription.renewalDate)}.</p>
        <Details rows={[
          ['Status', 'Active'],
          ['Next charge', `${money(subscription.monthlyCostEur)} on ${displayDate(subscription.renewalDate, true)}`],
        ]} />
        <p className="rb-note">You can cancel any time from the Overview or the team member’s page.</p>
      </div> : <>
        <h1>Subscription unavailable</h1><ErrorMessage message="This subscription could not be found." />
      </>}
    </RoleBLayout>
  );
}
