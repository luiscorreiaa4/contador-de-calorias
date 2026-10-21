/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import {
  createBrowserRouter,
  createMemoryRouter,
  Navigate,
  type RouteObject,
} from 'react-router';
import { RootLayout } from './components/layout/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { SectionLayout } from './components/layout/SectionLayout';
const LoginPage = lazy(() =>
  import('./pages/public/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const VerifyEmailPage = lazy(() =>
  import('./pages/public/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/public/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/public/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const OnboardingFlow = lazy(() =>
  import('./components/onboarding/OnboardingFlow').then((m) => ({
    default: m.OnboardingFlow,
  }))
);

const DashboardPage = lazy(() =>
  import('./pages/private/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  }))
);
const EditProfilePage = lazy(() =>
  import('./pages/private/EditProfilePage').then((m) => ({
    default: m.EditProfilePage,
  }))
);
const StatsPage = lazy(() =>
  import('./pages/private/StatsPage').then((m) => ({ default: m.StatsPage }))
);
const MeasurementsPage = lazy(() =>
  import('./pages/private/MeasurementsPage').then((m) => ({ default: m.MeasurementsPage }))
);
const RoutinePage = lazy(() => import('./pages/private/RoutinePage').then(m => ({ default: m.RoutinePage })));
const GoalSettingsCard = lazy(() => import('./components/profile/GoalSettingsCard').then(m => ({ default: m.GoalSettingsCard })));
const NotificationsPage = lazy(() => import('./pages/private/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const AccountSecurityPage = lazy(() => import('./pages/private/AccountSecurityPage').then(m => ({ default: m.AccountSecurityPage })));
const AccountPrivacyPage = lazy(() => import('./pages/private/AccountPrivacyPage').then(m => ({ default: m.AccountPrivacyPage })));
const TermsPage = lazy(() =>
  import('./pages/public/LegalPage').then((m) => ({ default: m.TermsPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/public/LegalPage').then((m) => ({ default: m.PrivacyPage }))
);
const SecurityPage = lazy(() =>
  import('./pages/public/LegalPage').then((m) => ({ default: m.SecurityPage }))
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <PublicRoute />,
        children: [
          { path: 'login', element: <LoginPage initialMode="login" /> },
          { path: 'cadastro', element: <LoginPage initialMode="register" /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'onboarding', element: <OnboardingFlow /> },
          { index: true, element: <DashboardPage /> },
          { path: 'estatisticas', element: <Navigate to="/evolucao/alimentacao" replace /> },
          { path: 'medidas', element: <Navigate to="/evolucao/corpo" replace /> },
          {
            path: 'evolucao',
            element: <SectionLayout title="Evolução" description="Acompanhe sua alimentação e suas medidas ao longo do tempo." links={[
              { to: '/evolucao/alimentacao', label: 'Alimentação' },
              { to: '/evolucao/corpo', label: 'Peso e medidas' },
            ]} />,
            children: [
              { index: true, element: <Navigate to="alimentacao" replace /> },
              { path: 'alimentacao', element: <StatsPage embedded /> },
              { path: 'corpo', element: <MeasurementsPage embedded /> },
            ],
          },
          {
            path: 'metas',
            element: <SectionLayout title="Metas" description="Defina seu objetivo, sua rotina e as metas que orientam seu dia." links={[
              { to: '/metas/rotina', label: 'Objetivo e rotina' },
              { to: '/metas/diarias', label: 'Metas diárias' },
            ]} />,
            children: [
              { index: true, element: <Navigate to="rotina" replace /> },
              { path: 'rotina', element: <RoutinePage /> },
              { path: 'diarias', element: <GoalSettingsCard /> },
            ],
          },
          {
            path: 'configuracoes',
            element: <SectionLayout title="Configurações" description="Gerencie lembretes, segurança e os dados da sua conta." links={[
              { to: '/configuracoes/notificacoes', label: 'Notificações' },
              { to: '/configuracoes/seguranca', label: 'Segurança' },
              { to: '/configuracoes/privacidade', label: 'Privacidade e dados', shortLabel: 'Privacidade' },
            ]} />,
            children: [
              { index: true, element: <Navigate to="notificacoes" replace /> },
              { path: 'notificacoes', element: <NotificationsPage /> },
              { path: 'seguranca', element: <AccountSecurityPage /> },
              { path: 'privacidade', element: <AccountPrivacyPage /> },
            ],
          },
          { path: 'perfil', element: <EditProfilePage /> },
          { path: 'diario/:date', element: <DashboardPage /> },
        ],
      },
      // Telas públicas de autenticação por e-mail (acessíveis também fora do login).
      { path: 'verificar-email', element: <VerifyEmailPage /> },
      { path: 'esqueci-senha', element: <ForgotPasswordPage /> },
      { path: 'redefinir-senha', element: <ResetPasswordPage /> },
      // Páginas legais públicas (acessíveis mesmo autenticado).
      { path: 'termos', element: <TermsPage /> },
      { path: 'privacidade', element: <PrivacyPage /> },
      { path: 'seguranca', element: <SecurityPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

export const createTestRouter = (initialEntries: string[] = ['/']) => {
  return createMemoryRouter(routes, { initialEntries });
};
