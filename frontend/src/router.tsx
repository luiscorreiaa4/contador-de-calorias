/* eslint-disable react-refresh/only-export-components */
import { lazy, type FC } from 'react';
import { createMemoryRouter, Navigate, useLocation, type RouteObject } from 'react-router';
import { RootLayout } from './components/layout/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { PublicRoute } from './components/PublicRoute';
import { SectionLayout } from './components/layout/SectionLayout';
import { CONFIG_TABS, HISTORICO_TABS, METAS_TABS } from './navigation/nav-items';
// Import direto (sem lazy): a landing pré-renderizada hidrata sem cair no fallback do Suspense.
import { LandingPage } from './pages/public/LandingPage';

/** URLs antigas do app (antes de /app): mantêm favoritos, e-mails e o PWA instalado funcionando. */
const ToApp: FC = () => {
  const { pathname, search } = useLocation();
  return <Navigate to={`/app${pathname}${search}`} replace />;
};

const AdminCatalogPage = lazy(() =>
  import('./pages/admin/AdminCatalogPage').then((m) => ({ default: m.AdminCatalogPage })),
);
const LoginPage = lazy(() =>
  import('./pages/public/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const VerifyEmailPage = lazy(() =>
  import('./pages/public/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/public/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/public/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/public/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const OnboardingFlow = lazy(() =>
  import('./components/onboarding/OnboardingFlow').then((m) => ({
    default: m.OnboardingFlow,
  })),
);

const DiaryPage = lazy(() =>
  import('./pages/private/DiaryPage').then((m) => ({
    default: m.DiaryPage,
  })),
);
const EditProfilePage = lazy(() =>
  import('./pages/private/EditProfilePage').then((m) => ({
    default: m.EditProfilePage,
  })),
);
const StatsPage = lazy(() =>
  import('./pages/private/StatsPage').then((m) => ({ default: m.StatsPage })),
);
const MeasurementsPage = lazy(() =>
  import('./pages/private/MeasurementsPage').then((m) => ({ default: m.MeasurementsPage })),
);
const RoutinePage = lazy(() =>
  import('./pages/private/RoutinePage').then((m) => ({ default: m.RoutinePage })),
);
const GoalSettingsCard = lazy(() =>
  import('./components/profile/GoalSettingsCard').then((m) => ({ default: m.GoalSettingsCard })),
);
const NotificationsPage = lazy(() =>
  import('./pages/private/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const AccountSecurityPage = lazy(() =>
  import('./pages/private/AccountSecurityPage').then((m) => ({ default: m.AccountSecurityPage })),
);
const AccountPrivacyPage = lazy(() =>
  import('./pages/private/AccountPrivacyPage').then((m) => ({ default: m.AccountPrivacyPage })),
);
const TermsPage = lazy(() =>
  import('./pages/public/LegalPage').then((m) => ({ default: m.TermsPage })),
);
const AccountPage = lazy(() =>
  import('./pages/private/AccountPage').then((m) => ({ default: m.AccountPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/public/LegalPage').then((m) => ({ default: m.PrivacyPage })),
);
const SecurityPage = lazy(() =>
  import('./pages/public/LegalPage').then((m) => ({ default: m.SecurityPage })),
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        // Logado, a landing e as telas de entrada levam ao app (redirect só no cliente: o prerender é deslogado).
        element: <PublicRoute />,
        children: [
          { index: true, element: <LandingPage /> },
          { path: 'login', element: <LoginPage initialMode="login" /> },
          { path: 'cadastro', element: <LoginPage initialMode="register" /> },
        ],
      },
      {
        path: 'app',
        element: <ProtectedRoute />,
        children: [
          { path: 'onboarding', element: <OnboardingFlow /> },
          { index: true, element: <DiaryPage /> },
          {
            path: 'historico',
            element: (
              <SectionLayout
                title="Histórico"
                description="Acompanhe sua alimentação, seu peso e suas medidas ao longo do tempo."
                links={HISTORICO_TABS}
              />
            ),
            children: [
              { index: true, element: <Navigate to="alimentacao" replace /> },
              { path: 'alimentacao', element: <StatsPage embedded /> },
              { path: 'corpo', element: <MeasurementsPage embedded /> },
            ],
          },
          {
            path: 'metas',
            element: (
              <SectionLayout
                title="Metas"
                description="Defina seu objetivo, sua rotina e as metas que orientam seu dia."
                links={METAS_TABS}
              />
            ),
            children: [
              { index: true, element: <Navigate to="rotina" replace /> },
              { path: 'rotina', element: <RoutinePage /> },
              { path: 'diarias', element: <GoalSettingsCard /> },
            ],
          },
          {
            path: 'configuracoes',
            element: (
              <SectionLayout
                title="Configurações"
                description="Gerencie lembretes, segurança e os dados da sua conta."
                links={CONFIG_TABS}
              />
            ),
            children: [
              { index: true, element: <Navigate to="notificacoes" replace /> },
              { path: 'notificacoes', element: <NotificationsPage /> },
              { path: 'seguranca', element: <AccountSecurityPage /> },
              { path: 'privacidade', element: <AccountPrivacyPage /> },
            ],
          },
          { path: 'conta', element: <AccountPage /> },
          { path: 'perfil', element: <EditProfilePage /> },
          { path: 'diario/:date', element: <DiaryPage /> },
        ],
      },
      // URLs antigas.
      { path: 'estatisticas', element: <Navigate to="/app/historico/alimentacao" replace /> },
      { path: 'medidas', element: <Navigate to="/app/historico/corpo" replace /> },
      { path: 'evolucao/corpo', element: <Navigate to="/app/historico/corpo" replace /> },
      { path: 'evolucao/*', element: <Navigate to="/app/historico/alimentacao" replace /> },
      ...[
        'onboarding',
        'historico/*',
        'metas/*',
        'configuracoes/*',
        'conta',
        'perfil',
        'diario/:date',
      ].map((path) => ({ path, element: <ToApp /> })),
      {
        element: <AdminRoute />,
        children: [{ path: 'admin/alimentos', element: <AdminCatalogPage /> }],
      },
      // Telas públicas de autenticação por e-mail (acessíveis também fora do login).
      { path: 'verificar-email', element: <VerifyEmailPage /> },
      { path: 'esqueci-senha', element: <ForgotPasswordPage /> },
      { path: 'redefinir-senha', element: <ResetPasswordPage /> },
      // Páginas legais públicas (acessíveis mesmo autenticado).
      { path: 'termos', element: <TermsPage /> },
      { path: 'privacidade', element: <PrivacyPage /> },
      { path: 'seguranca', element: <SecurityPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const createTestRouter = (initialEntries: string[] = ['/']) => {
  return createMemoryRouter(routes, { initialEntries });
};
