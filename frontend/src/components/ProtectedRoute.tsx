import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Se o usuário não concluiu o onboarding e tenta acessar outra rota, redireciona para /onboarding
  if (!user?.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Se o usuário já concluiu o onboarding e tenta acessar /onboarding, redireciona para /
  if (user?.onboarding_completed && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
