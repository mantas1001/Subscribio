import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
import { AuthProvider } from './auth/AuthProvider';
import AuthGate from './auth/AuthGate';
import AppShell from './components/layout/AppShell';
import OverviewPage from './pages/overview/OverviewPage';
import { EmployeesRoute, EmployeeDetailRoute, SubscriptionRoute } from './pages/employees/RoleBRoutes';
import AddEmployeePage from './pages/add-employee/AddEmployeePage';
import AddSubscriptionPage from './pages/subscriptions/AddSubscriptionPage';
import DesignSystemPage from './pages/design-system/DesignSystemPage';
import RequestsPage from './pages/requests/RequestsPage';
import RequestDetailPage from './pages/requests/RequestDetailPage';
import RequestApprovedPage from './pages/requests/RequestApprovedPage';
import ReadyToPurchasePage from './pages/requests/ReadyToPurchasePage';
import PurchaseRecordedPage from './pages/requests/PurchaseRecordedPage';
import RequestDeclinedPage from './pages/requests/RequestDeclinedPage';
import ActivityPage from './pages/activity/ActivityPage';

// Routes (Figma frame → path). Owners replace their ComingSoon entry with the real page.
//   1.1 / 1.2 / 1.3 Overview           → /                        (Role A)
//   2.1 Pending requests / 2.9 empty    → /requests                (Role A)
//   2.2 detail + 2.7 decline sheet      → /requests/:requestId     (Role A)
//   2.3 Request approved                → /requests/:requestId/approved
//   2.4 Ready to purchase + 2.5/2.5a    → /requests/:requestId/purchase
//   2.6 Purchase recorded               → /requests/:requestId/recorded
//   2.8 Request declined                → /requests/:requestId/declined
//   3.1 Employees                       → /employees               (Role B)
//   3.2 Employee detail                 → /employees/:employeeId   (Role B)
//   4.1–4.4 Renewal detail / cancel     → /subscriptions/:subscriptionId (Role B)
//   5.1–5.3 Add team member             → /add-employee            (Role C)
//   Add subscription (no Figma frame)   → /add-subscription?employee=<id>  (built like 5.1–5.3)
//   Design system                       → /design-system           (Role C)
//   Activity log (shared workspace)     → /activity
// Google sign-in (Supabase Auth) wraps everything: AuthGate shows the sign-in screen until the
// user is signed in. See src/auth/ and "Google sign-in" in the README.
export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <StoreProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="requests" element={<RequestsPage />} />
                <Route path="requests/:requestId" element={<RequestDetailPage />} />
                <Route path="requests/:requestId/approved" element={<RequestApprovedPage />} />
                <Route path="requests/:requestId/purchase" element={<ReadyToPurchasePage />} />
                <Route path="requests/:requestId/recorded" element={<PurchaseRecordedPage />} />
                <Route path="requests/:requestId/declined" element={<RequestDeclinedPage />} />
                <Route path="add-employee" element={<AddEmployeePage />} />
                <Route path="add-subscription" element={<AddSubscriptionPage />} />
                <Route path="design-system" element={<DesignSystemPage />} />
                <Route path="activity" element={<ActivityPage />} />
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
      </AuthGate>
    </AuthProvider>
  );
}
