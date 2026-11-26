import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ErrorMessage from '../../components/ui/ErrorMessage';
import RoleBLayout, { Details, ToolLogo } from '../employees/RoleBLayout';
import { displayDate, money, monthlyTotal, renewalLabel, subscriptionPath,
  toolName, type LoadState, type RoleBData } from '../employees/roleBModels';
import CancelSubscriptionDialog from './CancelSubscriptionDialog';
import SubscriptionCancelledPage from './SubscriptionCancelledPage';

export type SubscriptionDetailPageProps = RoleBData & LoadState & {
  subscriptionId: string;
  confirming?: boolean;
  cancelSubscription: (id: string) => void | Promise<void>;
};

export default function SubscriptionDetailPage({ subscriptionId, employees, subscriptions,
  confirming = false, cancelSubscription, loading, error }: SubscriptionDetailPageProps) {
  const navigate = useNavigate();
  const subscription = subscriptions.find(item => item.id === subscriptionId);
  if (loading || error || !subscription) return (
    <RoleBLayout title="Renewal" backTo="/" activeTab="overview">
      <h1 className="rb-visually-hidden">Renewal</h1>
      {loading ? <p role="status">Loading subscription…</p>
        : <ErrorMessage message={error || 'This subscription could not be found.'} />}
      <a className="rb-text-link" href="#/">Back to overview</a>
    </RoleBLayout>
  );
  if (subscription.status === 'cancelled') return (
    <SubscriptionCancelledPage subscriptionId={subscriptionId} employees={employees} subscriptions={subscriptions} />
  );
  const owners = employees.filter(employee => employee.subscriptionIds.includes(subscriptionId));
  const ownerNames = owners.map(employee => employee.name).join(', ');
  const department = [...new Set(owners.map(employee => employee.role).filter(Boolean))].join(', ');
  const mostExpensive = subscriptions.filter(item => item.status === 'active')
    .every(item => item.monthlyCostEur <= subscription.monthlyCostEur);
  const basePath = subscriptionPath(subscriptionId);
  return (
    <RoleBLayout title="Renewal" backTo="/" activeTab="overview" footer={<>
      <Button variant="danger" className="rb-danger-outline rb-full-width"
        onClick={() => navigate(`${basePath}/cancel`)}>Cancel subscription</Button>
      <Button variant="secondary" className="rb-full-width"
        onClick={() => navigate(`${basePath}/kept`)}>Keep it</Button>
    </>}>
      <p className="rb-eyebrow">{renewalLabel(subscription.renewalDate)}</p>
      <div className="rb-subscription-heading">
        <ToolLogo tool={toolName(subscription)} large />
        <div><h1 className="rb-subscription-name">{subscription.tool}{subscription.plan && ` · ${subscription.plan}`}</h1><Badge tone="success">Active</Badge></div>
      </div>
      <div className="rb-renewal-details">
        <Details rows={[
          ['Owner', ownerNames || 'No employee assigned'],
          ['Department', department || 'Not specified'],
          ['Cost', `${money(subscription.monthlyCostEur)} / month`],
          ['Next charge', displayDate(subscription.renewalDate, true)],
          ['Billing', 'Monthly'],
        ]} />
        <p className="rb-note rb-note--warning">{mostExpensive && 'It is your most expensive tool. '}
          Cancelling saves {money(subscription.monthlyCostEur * 12).replace(/\.00$/, '')} a year.</p>
      </div>
      {confirming && <CancelSubscriptionDialog subscription={subscription} ownerNames={ownerNames}
        monthlySpend={monthlyTotal(subscriptions)} onDismiss={() => navigate(basePath, { replace: true })}
        onConfirm={async () => {
          await cancelSubscription(subscriptionId);
          navigate(`${basePath}/cancelled`, { replace: true });
        }} />}
    </RoleBLayout>
  );
}
