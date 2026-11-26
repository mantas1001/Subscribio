import { Card, ListRow, Badge, EmptyState, ErrorMessage } from './RoleBControls';
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
      <h2>Subscriptions</h2>
      {tools.length === 0 ? (
        <EmptyState title="No active subscriptions" description={`${employee.name} has no active tools assigned.`} />
      ) : (
        <Card className="rb-list" role="group" aria-label={`${employee.name}'s subscriptions`}>
          {tools.map(subscription => (
            <ListRow key={subscription.id} to={subscriptionPath(subscription.id)}>
              <ToolLogo tool={toolName(subscription)} />
              <span className="rb-list-copy"><span className="rb-row-title">{toolName(subscription)}</span>
                <span className="rb-row-subtitle">Renews {displayDate(subscription.renewalDate)}</span></span>
              <span className="rb-row-price">{money(subscription.monthlyCostEur)}</span>
              <Badge>Active</Badge>
            </ListRow>
          ))}
        </Card>
      )}
    </RoleBLayout>
  );
}
