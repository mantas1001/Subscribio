import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmployeeListLink from './EmployeeListLink';
import EmptyState from '../../components/ui/EmptyState';
import ErrorMessage from '../../components/ui/ErrorMessage';
import RoleBLayout from './RoleBLayout';
import PageHeader from '../../components/layout/PageHeader';
import { activeTools, employeePath, initials, money, monthlyTotal,
  type LoadState, type RoleBData } from './roleBModels';

export type EmployeesPageProps = RoleBData & LoadState;

export default function EmployeesPage({ employees, subscriptions, loading, error }: EmployeesPageProps) {
  const navigate = useNavigate();
  return (
    <RoleBLayout>
      <PageHeader title="Employees" description="Who has what, and what it costs." />
      {loading ? <p role="status">Loading employees…</p> : error ? (
        <ErrorMessage message={error} />
      ) : employees.length === 0 ? (
        <EmptyState title="No employees yet" description="Add an employee to start tracking their tools." />
      ) : (
        <Card className="rb-list !p-0 overflow-hidden">
          {/* Desktop column headers (decorative: every row reads on its own for screen readers). */}
          <div aria-hidden="true"
            className="hidden items-center gap-3 border-b border-line bg-canvas/60 px-6 py-2.5 text-label font-medium text-muted lg:flex">
            <span className="w-11 shrink-0" />
            <span className="grid flex-1 grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)] gap-4">
              <span>Name</span><span>Department</span><span>Tools</span>
            </span>
            <span className="w-[120px] shrink-0 text-right">Monthly cost</span>
            <span className="w-2 shrink-0" />
          </div>
          <ul className="rb-employee-list" aria-label="Employees">
            {employees.map(employee => {
              const tools = activeTools(employee, subscriptions);
              const toolCount = `${tools.length} ${tools.length === 1 ? 'tool' : 'tools'}`;
              return (
                <EmployeeListLink key={employee.id} to={employeePath(employee.id)}
                  leading={<span className="rb-avatar" aria-hidden="true">{initials(employee.name)}</span>}
                  trailing={<span className="rb-list-price"><span>{money(monthlyTotal(tools))}</span>
                    <span className="rb-price-period">/month</span></span>}>
                  <span className="rb-list-copy lg:!grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center lg:gap-4">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="rb-row-title">{employee.name}</span>
                      <span className="hidden truncate text-caption text-muted lg:block">{employee.email}</span>
                    </span>
                    <span className="rb-row-subtitle lg:hidden">{employee.role && `${employee.role} · `}{toolCount}</span>
                    <span className="hidden truncate text-small text-brand-ink lg:block">{employee.role || 'Not set'}</span>
                    <span className="hidden text-small text-muted lg:block">{toolCount}</span>
                  </span>
                </EmployeeListLink>
              );
            })}
          </ul>
        </Card>
      )}
      <Button variant="secondary" className="rb-full-width rb-add-employee" onClick={() => navigate('/add-employee')}>
        <span aria-hidden="true">+&nbsp; </span>Add employee
      </Button>
    </RoleBLayout>
  );
}
