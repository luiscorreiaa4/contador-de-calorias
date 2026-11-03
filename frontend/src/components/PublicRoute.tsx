import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface PublicRouteProps {
  children?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    if (!user?.onboarding_completed) {
      return <Navigate to="/app/onboarding" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
