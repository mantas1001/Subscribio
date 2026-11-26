import { useParams } from 'react-router-dom';
import { useStore } from '../../store';
import EmployeesPage from './EmployeesPage';
import EmployeeDetailPage from './EmployeeDetailPage';
import SubscriptionDetailPage from '../subscriptions/SubscriptionDetailPage';
import SubscriptionCancelledPage from '../subscriptions/SubscriptionCancelledPage';
import SubscriptionKeptPage from '../subscriptions/SubscriptionKeptPage';

export function EmployeesRoute() {
  const { employees, subscriptions } = useStore();
  return <EmployeesPage employees={employees} subscriptions={subscriptions} />;
}

export function EmployeeDetailRoute() {
  const { employeeId = '' } = useParams();
  const { employees, subscriptions } = useStore();
  return <EmployeeDetailPage employeeId={employeeId} employees={employees} subscriptions={subscriptions} />;
}

export function SubscriptionRoute({ screen }: { screen?: 'confirm' | 'cancelled' | 'kept' }) {
  const { subscriptionId = '' } = useParams();
  const { employees, subscriptions, cancelSubscription } = useStore();
  const data = { subscriptionId, employees, subscriptions };

  if (screen === 'cancelled') return <SubscriptionCancelledPage {...data} />;
  if (screen === 'kept') return <SubscriptionKeptPage {...data} />;
  return <SubscriptionDetailPage {...data} confirming={screen === 'confirm'} cancelSubscription={cancelSubscription} />;
}
