import Card from '../../components/ui/Card';
import EmployeeListLink from './EmployeeListLink';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorMessage from '../../components/ui/ErrorMessage';
import RoleBLayout, { ToolLogo } from './RoleBLayout';
import { activeTools, compactMoney, displayDate, initials, money, monthlyTotal,
  subscriptionPath, toolName, type LoadState, type RoleBData } from './roleBModels';

export type EmployeeDetailPageProps = RoleBData & LoadState & { employeeId: string };

export default function EmployeeDetailPage({ employeeId, employees, subscriptions,
  loading, error }: EmployeeDetailPageProps) {
  const employee = employees.find(item => item.id === employeeId);
  if (loading || error || !employee) return (
    <RoleBLayout title="Team member" backTo="/employees">
      <h1 className="rb-visually-hidden">Team member</h1>
      {loading ? <p role="status">Loading team member…</p>
        : <ErrorMessage message={error || 'This team member could not be found.'} />}
      <a className="rb-text-link" href="#/employees">Back to employees</a>
    </RoleBLayout>
  );
  const tools = activeTools(employee, subscriptions);
  const departmentPeople = employees.filter(item => item.role === employee.role).length;
  return (
    <RoleBLayout title="Team member" backTo="/employees">
      <div className="rb-profile">
        <span className="rb-avatar rb-avatar--large" aria-hidden="true">{initials(employee.name)}</span>
        <div className="rb-profile-copy">
          <h1 className="rb-profile-name">{employee.name}</h1>
          <p className="rb-profile-contact">{employee.role && `${employee.role} · `}{employee.email}</p>
        </div>
      </div>
      <div className="rb-employee-details">
        <div className="rb-metrics">
          <Card className="rb-metric rb-metric--primary">
            <p className="rb-metric-label">Monthly cost</p>
            <p className="rb-metric-amount">{compactMoney(monthlyTotal(tools))}<span>/mo</span></p>
            <p className="rb-metric-footnote">{tools.length} active {tools.length === 1 ? 'subscription' : 'subscriptions'}</p>
          </Card>
          <Card className="rb-metric">
            <p className="rb-metric-label">Department</p>
            <p className="rb-metric-amount rb-department">{employee.role || 'Not specified'}</p>
            <p className="rb-metric-footnote">{employee.role
              ? `${departmentPeople} ${departmentPeople === 1 ? 'person' : 'people'}` : 'No department set'}</p>
          </Card>
        </div>
        <section className="rb-assigned-subscriptions" aria-labelledby="rb-assigned-subscriptions">
          <h2 id="rb-assigned-subscriptions">Subscriptions</h2>
          {tools.length === 0 ? (
            <EmptyState title="No active subscriptions" description={`${employee.name} has no active tools assigned.`} />
          ) : (
            <Card className="rb-list !p-0">
              <ul aria-label={`${employee.name}'s subscriptions`}>
                {tools.map(subscription => (
                  <EmployeeListLink key={subscription.id} to={subscriptionPath(subscription.id)}
                    leading={<ToolLogo tool={toolName(subscription)} />}
                    trailing={<span className="flex flex-wrap items-center justify-end gap-2">
                      <span className="rb-row-price">{money(subscription.monthlyCostEur)}</span>
                      <Badge tone="success">Active</Badge>
                    </span>}>
                    <span className="rb-list-copy"><span className="rb-row-title">{toolName(subscription)}</span>
                      <span className="rb-row-subtitle">Renews {displayDate(subscription.renewalDate)}</span></span>
                  </EmployeeListLink>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </RoleBLayout>
  );
}
