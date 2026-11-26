import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/overview/OverviewPage';
import ComingSoon from './pages/ComingSoon';
import AddEmployeePage from './pages/add-employee/AddEmployeePage';
import DesignSystemPage from './pages/design-system/DesignSystemPage';

// Routes (Figma frame → path). Owners replace their ComingSoon entry with the real page.
//   1.1 / 1.2 / 1.3 Overview           → /                        (Role A)
//   2.1 Pending requests / 2.9 empty    → /requests                (Role A)
//   2.2–2.8, 2.5a request flow          → /requests/:requestId     (Role A)
//   3.1 Employees                       → /employees               (Role B)
//   3.2 Employee detail                 → /employees/:employeeId   (Role B)
//   4.1–4.4 Renewal detail / cancel     → /subscriptions/:subscriptionId (Role B)
//   5.1–5.3 Add team member             → /add-employee            (Role C)
//   Design system                       → /design-system           (Role C)
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<OverviewPage />} />
            <Route path="requests" element={<ComingSoon title="Requests" owner="Role A" />} />
            <Route
              path="requests/:requestId"
              element={<ComingSoon title="Request" owner="Role A" back="/requests" />}
            />
            <Route path="employees" element={<ComingSoon title="Employees" owner="Role B" />} />
            <Route
              path="employees/:employeeId"
              element={<ComingSoon title="Team member" owner="Role B" back="/employees" />}
            />
            <Route
              path="subscriptions/:subscriptionId"
              element={<ComingSoon title="Renewal" owner="Role B" back="/" />}
            />
            <Route path="add-employee" element={<AddEmployeePage />} />
            <Route path="design-system" element={<DesignSystemPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
