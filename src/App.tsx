// ============================================
// Casa Clara — Main App (Router)
// ============================================

import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { HouseholdProvider } from './hooks/useHousehold';
import { AuthGuard, HouseholdGuard, FeatureRouteGuard, AdminGuard, PublicOnlyGuard } from './components/shared/Guards';
import { LoadingPage } from './components/ui';

const AppLayout = lazyNamed(() => import('./components/layout/AppLayout'), 'AppLayout');

// Public pages
const LandingPage = lazyNamed(() => import('./features/landing/LandingPage'), 'LandingPage');
const LoginPage = lazyNamed(() => import('./features/auth/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('./features/auth/RegisterPage'), 'RegisterPage');
const ForgotPasswordPage = lazyNamed(() => import('./features/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('./features/auth/ResetPasswordPage'), 'ResetPasswordPage');
const VerifyEmailPage = lazyNamed(() => import('./features/auth/VerifyEmailPage'), 'VerifyEmailPage');

// Onboarding
const OnboardingPage = lazyNamed(() => import('./features/onboarding/OnboardingPage'), 'OnboardingPage');
const InvitationPage = lazyNamed(() => import('./features/onboarding/InvitationPage'), 'InvitationPage');

// App pages
const DashboardPage = lazyNamed(() => import('./features/dashboard/DashboardPage'), 'DashboardPage');
const TransactionsPage = lazyNamed(() => import('./features/transactions/TransactionsPage'), 'TransactionsPage');
const CategoriesPage = lazyNamed(() => import('./features/categories/CategoriesPage'), 'CategoriesPage');
const SplitPage = lazyNamed(() => import('./features/split/SplitPage'), 'SplitPage');
const CalendarPage = lazyNamed(() => import('./features/calendar/CalendarPage'), 'CalendarPage');
const GoalsPage = lazyNamed(() => import('./features/goals/GoalsPage'), 'GoalsPage');
const MonthlySummaryPage = lazyNamed(() => import('./features/monthly-review/MonthlySummaryPage'), 'MonthlySummaryPage');
const SettingsPage = lazyNamed(() => import('./features/settings/SettingsPage'), 'SettingsPage');
const SubscriptionPage = lazyNamed(() => import('./features/subscription/SubscriptionPage'), 'SubscriptionPage');

// Premium pages
const CsvImportPage = lazyNamed(() => import('./features/csv-import/CsvImportPage'), 'CsvImportPage');
const RecurringPage = lazyNamed(() => import('./features/recurring/RecurringPage'), 'RecurringPage');
const ComparisonPage = lazyNamed(() => import('./features/comparison/ComparisonPage'), 'ComparisonPage');
const GuidedClosePage = lazyNamed(() => import('./features/guided-close/GuidedClosePage'), 'GuidedClosePage');

// Admin
const AdminPage = lazyNamed(() => import('./features/admin/AdminPage'), 'AdminPage');

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HouseholdProvider>
          <Routes>
            <Route element={<PublicOnlyGuard />}>
              <Route path="/" element={<RouteScreen component={LandingPage} />} />
              <Route path="/login" element={<RouteScreen component={LoginPage} />} />
              <Route path="/registro" element={<RouteScreen component={RegisterPage} />} />
              <Route path="/recuperar-clave" element={<RouteScreen component={ForgotPasswordPage} />} />
            </Route>

            <Route path="/verificar-email" element={<RouteScreen component={VerifyEmailPage} />} />
            <Route path="/restablecer-clave" element={<RouteScreen component={ResetPasswordPage} />} />
            <Route path="/invitacion/:token" element={<RouteScreen component={InvitationPage} />} />

            <Route element={<AuthGuard />}>
              <Route path="/onboarding" element={<RouteScreen component={OnboardingPage} />} />

              <Route element={<HouseholdGuard />}>
                <Route element={<RouteScreen component={AppLayout} />}>
                  <Route path="/app/dashboard" element={<RouteScreen component={DashboardPage} />} />
                  <Route path="/app/movimientos" element={<RouteScreen component={TransactionsPage} />} />
                  <Route path="/app/categorias" element={<RouteScreen component={CategoriesPage} />} />
                  <Route path="/app/calendario" element={<RouteScreen component={CalendarPage} />} />
                  <Route path="/app/metas" element={<RouteScreen component={GoalsPage} />} />
                  <Route path="/app/resumen" element={<RouteScreen component={MonthlySummaryPage} />} />
                  <Route path="/app/configuracion" element={<RouteScreen component={SettingsPage} />} />
                  <Route path="/app/suscripcion" element={<RouteScreen component={SubscriptionPage} />} />

                  <Route element={<FeatureRouteGuard feature="split_manual" />}>
                    <Route path="/app/reparto" element={<RouteScreen component={SplitPage} />} />
                  </Route>

                  <Route element={<FeatureRouteGuard feature="monthly_close_simple" />}>
                    <Route path="/app/cierre" element={<RouteScreen component={GuidedClosePage} />} />
                  </Route>

                  <Route element={<FeatureRouteGuard feature="csv_import" />}>
                    <Route path="/app/csv" element={<RouteScreen component={CsvImportPage} />} />
                  </Route>

                  <Route element={<FeatureRouteGuard feature="recurring_transactions" />}>
                    <Route path="/app/recurrencias" element={<RouteScreen component={RecurringPage} />} />
                  </Route>

                  <Route element={<FeatureRouteGuard feature="monthly_comparison" />}>
                    <Route path="/app/comparacion" element={<RouteScreen component={ComparisonPage} />} />
                  </Route>
                </Route>
              </Route>

              <Route element={<AdminGuard />}>
                <Route path="/admin/*" element={<RouteScreen component={AdminPage} />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HouseholdProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RouteScreen({ component: Component }: { component: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Component />
    </Suspense>
  );
}

function lazyNamed<TModule extends Record<string, ComponentType<object>>, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  key: TKey,
) {
  return lazy(async () => {
    const module = await loader();
    return { default: module[key] };
  });
}
