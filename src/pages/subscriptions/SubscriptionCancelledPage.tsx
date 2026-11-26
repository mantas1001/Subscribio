import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import ErrorMessage from '../../components/ui/ErrorMessage';
import RoleBLayout, { Details, SuccessMark } from '../employees/RoleBLayout';
import { displayDate, money, monthlyTotal, toolName,
  type RoleBData } from '../employees/roleBModels';

export type SubscriptionCancelledPageProps = RoleBData & { subscriptionId: string };

export default function SubscriptionCancelledPage({ subscriptionId, employees, subscriptions }: SubscriptionCancelledPageProps) {
  const navigate = useNavigate();
  const subscription = subscriptions.find(item => item.id === subscriptionId);
  const valid = subscription?.status === 'cancelled';
  const owners = employees.filter(employee => employee.subscriptionIds.includes(subscriptionId));
  const names = new Intl.ListFormat('en', { type: 'conjunction' }).format(owners.map(employee => employee.name));
  return (
    <RoleBLayout tabs={false} footer={<>
      <Button variant="primary" className="rb-full-width" onClick={() => navigate('/')}>Back to overview</Button>
      {valid && <Button variant="secondary" className="rb-full-width" onClick={() => navigate('/employees')}>
        See team members
      </Button>}
    </>}>
      {valid ? <div className="rb-result">
        <SuccessMark />
        <h1>{toolName(subscription)} cancelled</h1>
        <p className="rb-muted">{names || 'The team'} {owners.length > 1 ? 'keep' : 'keeps'} access until{' '}
          {displayDate(subscription.renewalDate)}. It will not renew.</p>
        <Details rows={[
          ['Status', 'Cancelled'],
          ['New monthly total', money(monthlyTotal(subscriptions))],
          ['Saved per year', money(subscription.monthlyCostEur * 12)],
        ]} />
        <p className="rb-note rb-note--warning">Cancel it with the vendor too so you are not billed again.</p>
      </div> : <>
        <h1>Cancellation unavailable</h1>
        <ErrorMessage message={subscription
          ? 'This subscription has not been cancelled. Your spending has not changed.'
          : 'This subscription could not be found.'} />
      </>}
    </RoleBLayout>
  );
}
