import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Flame } from 'lucide-react';
import type { AuthMode } from '../../types/auth';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthCardProps {
  initialMode?: AuthMode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ initialMode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultMode: AuthMode =
    initialMode ||
    (location.pathname === '/cadastro' ? 'register' : 'login');

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    if (navigate) {
      navigate(newMode === 'register' ? '/cadastro' : '/login');
    }
  };

  const handleAuthSuccess = () => {
    if (mode === 'login') {
      setIsSuccessMessage('Login efetuado com sucesso! Redirecionando...');
      if (navigate) {
        navigate('/');
      }
    } else {
      setIsSuccessMessage('Conta criada! Faça login para continuar.');
      setMode('login');
      if (navigate) {
        navigate('/login');
      }
    }
    setTimeout(() => setIsSuccessMessage(null), 4000);
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-in">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground border-2 border-black mb-6 shadow-hard">
          <Flame className="w-6 h-6 fill-current" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-heading font-black tracking-tighter text-foreground uppercase">
          Bem-vindo de volta
        </h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Monitore calorias. Supere metas.
        </p>
      </div>

      {/* Card */}
      <div className="bg-card border-2 border-border shadow-hard">
        {/* Tab Header */}
        <div
          role="tablist"
          aria-label="Opções de acesso"
          className="flex border-b-2 border-border bg-background"
        >
          <button
            id="tab-login"
            role="tab"
            type="button"
            aria-selected={mode === 'login'}
            aria-controls="panel-auth"
            onClick={() => switchMode('login')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-200 border-r-2 border-border ${
              mode === 'login'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
            }`}
          >
            Entrar
          </button>

          <button
            id="tab-register"
            role="tab"
            type="button"
            aria-selected={mode === 'register'}
            aria-controls="panel-auth"
            onClick={() => switchMode('register')}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
              mode === 'register'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Success Alert */}
          {isSuccessMessage && (
            <div className="mb-6 p-4 bg-primary text-primary-foreground border-2 border-black text-xs font-bold uppercase tracking-widest text-center animate-in shadow-hard">
              {isSuccessMessage}
            </div>
          )}

          {/* Tab Panels */}
          <div id="panel-auth" role="tabpanel" tabIndex={0} className="focus:outline-none">
            {mode === 'login' ? (
              <LoginForm onSuccess={handleAuthSuccess} />
            ) : (
              <RegisterForm onSuccess={handleAuthSuccess} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
