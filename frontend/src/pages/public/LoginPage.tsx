import React from 'react';
import { AuthCard } from '../../components/auth/AuthCard';
import { DemoLoginButton } from '../../components/auth/DemoLoginButton';
import type { AuthMode } from '../../types/auth';

interface LoginPageProps {
  initialMode?: AuthMode;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 p-4 sm:p-6 my-auto">
      <AuthCard initialMode={initialMode} />
      <div className="w-full max-w-sm">
        <DemoLoginButton className="w-full" />
      </div>
    </div>
  );
};
