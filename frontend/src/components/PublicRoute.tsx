import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

interface PublicRouteProps {
  children?: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { state } = useLocation();
  const signingOut = (state as { signedOut?: boolean } | null)?.signedOut === true;

  if (isAuthenticated && !signingOut) {
    if (!user?.onboarding_completed) {
      return <Navigate to="/app/onboarding" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
