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
const LoginPage = lazy(() =>
  import('./pages/public/LoginPage').then((m) => ({ default: m.LoginPage }))
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
          { path: 'estatisticas', element: <StatsPage /> },
          { path: 'perfil', element: <EditProfilePage /> },
          // Reservado para D-20 (Fase 4.5)
          { path: 'diario/:date', element: <DashboardPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

export const createTestRouter = (initialEntries: string[] = ['/']) => {
  return createMemoryRouter(routes, { initialEntries });
};
