import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/overview/OverviewPage';
import { EmployeesRoute, EmployeeDetailRoute, SubscriptionRoute } from './pages/employees/RoleBRoutes';
import ComingSoon from './pages/ComingSoon';

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
            <Route
              path="add-employee"
              element={<ComingSoon title="Add team member" owner="Role C" back="/employees" />}
            />
            <Route
              path="design-system"
              element={<ComingSoon title="Design system" owner="Role C" back="/" />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          <Route element={<AppShell customChrome />}>
            <Route path="employees" element={<EmployeesRoute />} />
            <Route path="employees/:employeeId" element={<EmployeeDetailRoute />} />
            <Route path="subscriptions/:subscriptionId">
              <Route index element={<SubscriptionRoute />} />
              <Route path="cancel" element={<SubscriptionRoute screen="confirm" />} />
              <Route path="cancelled" element={<SubscriptionRoute screen="cancelled" />} />
              <Route path="kept" element={<SubscriptionRoute screen="kept" />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
