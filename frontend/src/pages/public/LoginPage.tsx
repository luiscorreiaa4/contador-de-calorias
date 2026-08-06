import React from 'react';
import { AuthCard } from '../../components/auth/AuthCard';

export const LoginPage: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 my-auto">
      <AuthCard />
    </div>
  );
};
