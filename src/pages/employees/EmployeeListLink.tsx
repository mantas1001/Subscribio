import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ListRow from '../../components/ui/ListRow';

type Props = {
  to: string;
  leading: ReactNode;
  trailing: ReactNode;
  children: ReactNode;
};

export default function EmployeeListLink({ to, leading, trailing, children }: Props) {
  return (
    <ListRow className="rb-linked-row" leading={leading} trailing={trailing} chevron>
      <Link to={to} className="rb-row-link">{children}</Link>
    </ListRow>
  );
}
