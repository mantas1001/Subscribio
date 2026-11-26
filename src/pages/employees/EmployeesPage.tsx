import { useNavigate } from 'react-router-dom';
import { Button, Card, ListRow, EmptyState, ErrorMessage } from './RoleBControls';
import RoleBLayout from './RoleBLayout';
import { activeTools, employeePath, initials, money, monthlyTotal,
  type LoadState, type RoleBData } from './roleBModels';

export type EmployeesPageProps = RoleBData & LoadState;

export default function EmployeesPage({ employees, subscriptions, loading, error }: EmployeesPageProps) {
  const navigate = useNavigate();
  return (
    <RoleBLayout>
      <h1>Employees</h1>
      <p className="rb-muted">Who has what, and what it costs.</p>
      {loading ? <p role="status">Loading employees…</p> : error ? (
        <ErrorMessage message={error} />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees yet" description="Add an employee to start tracking their tools." />
      ) : (
        <Card className="rb-list rb-employee-list" role="group" aria-label="Employees">
          {employees.map(employee => {
            const tools = activeTools(employee, subscriptions);
            return (
              <ListRow key={employee.id} to={employeePath(employee.id)}>
                <span className="rb-avatar" aria-hidden="true">{initials(employee.name)}</span>
                <span className="rb-list-copy">
                  <span className="rb-row-title">{employee.name}</span>
                  <span className="rb-row-subtitle">{employee.role && `${employee.role} · `}
                    {tools.length} {tools.length === 1 ? 'tool' : 'tools'}</span>
                </span>
                <span className="rb-list-price"><span>{money(monthlyTotal(tools))}</span>
                  <span className="rb-price-period">/month</span></span>
              </ListRow>
            );
          })}
        </Card>
      )}
      <Button variant="secondary" className="rb-full-width" onClick={() => navigate('/add-employee')}>
        <span aria-hidden="true">+&nbsp; </span>Add employee
      </Button>
    </RoleBLayout>
  );
}
