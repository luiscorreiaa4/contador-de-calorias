import React, { useState } from 'react';
import { Flame } from 'lucide-react';
import type { AuthMode } from '../../types/auth';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthCard: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isSuccessMessage, setIsSuccessMessage] = useState<string | null>(null);

  const handleAuthSuccess = () => {
    if (mode === 'login') {
      setIsSuccessMessage('Login efetuado com sucesso! Redirecionando...');
    } else {
      setIsSuccessMessage('Conta criada! Faça login para continuar.');
      setMode('login');
    }
    setTimeout(() => setIsSuccessMessage(null), 4000);
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-in">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white mb-4">
          <Flame className="w-5 h-5 fill-current" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Bem-vindo de volta
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Monitore suas calorias e alcance seus objetivos.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm shadow-zinc-900/5 dark:shadow-none">
        {/* Tab Header */}
        <div
          role="tablist"
          aria-label="Opções de acesso"
          className="flex border-b border-zinc-100 dark:border-zinc-800"
        >
          <button
            id="tab-login"
            role="tab"
            type="button"
            aria-selected={mode === 'login'}
            aria-controls="panel-auth"
            onClick={() => setMode('login')}
            className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 relative ${
              mode === 'login'
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            Entrar
            {mode === 'login' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            id="tab-register"
            role="tab"
            type="button"
            aria-selected={mode === 'register'}
            aria-controls="panel-auth"
            onClick={() => setMode('register')}
            className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 relative ${
              mode === 'register'
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            Criar conta
            {mode === 'register' && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Success Alert */}
          {isSuccessMessage && (
            <div className="mb-5 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-sm text-center animate-in">
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
