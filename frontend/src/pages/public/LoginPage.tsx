import React from 'react';
import { AuthCard } from '../../components/auth/AuthCard';
import type { AuthMode } from '../../types/auth';

interface LoginPageProps {
  initialMode?: AuthMode;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode }) => {
  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 my-auto">
      <AuthCard initialMode={initialMode} />
    </div>
  );
};
