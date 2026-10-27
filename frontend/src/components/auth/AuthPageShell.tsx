import React from 'react';
import { Flame } from 'lucide-react';

interface AuthPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/** Moldura visual compartilhada pelas telas públicas de autenticação. */
export const AuthPageShell: React.FC<AuthPageShellProps> = ({ title, description, children }) => (
  <div className="w-full max-w-md mx-auto animate-in">
    <div className="mb-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground border-2 border-edge mb-6 shadow-hard">
        <Flame className="w-6 h-6 fill-current" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-heading font-black tracking-tighter text-foreground uppercase">
        {title}
      </h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
        {description}
      </p>
    </div>

    <div className="bg-card border-2 border-border shadow-hard p-6 sm:p-8">{children}</div>
  </div>
);
