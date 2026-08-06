import React, { useState } from 'react';
import { Flame, LogIn, UserPlus } from 'lucide-react';
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
      setIsSuccessMessage('Conta criada com sucesso! Faça login para continuar.');
      setMode('login');
    }
    setTimeout(() => setIsSuccessMessage(null), 4000);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Header & Branding */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-3 transform hover:scale-105 transition-transform duration-200">
          <Flame className="w-8 h-8 fill-current" aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contador de Calorias
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
          Monitore suas refeições, registre calorias e alcance seus objetivos de saúde.
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-900/10 dark:shadow-black/50 transition-all duration-300">
        {/* Success Alert Banner */}
        {isSuccessMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium text-center animate-fade-in">
            {isSuccessMessage}
          </div>
        )}

        {/* Tab Selection */}
        <div
          role="tablist"
          aria-label="Opções de acesso"
          className="grid grid-cols-2 p-1.5 mb-6 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/50"
        >
          <button
            id="tab-login"
            role="tab"
            type="button"
            aria-selected={mode === 'login'}
            aria-controls="panel-login"
            onClick={() => setMode('login')}
            className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 min-h-[44px] ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md shadow-slate-900/5'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>Entrar</span>
          </button>

          <button
            id="tab-register"
            role="tab"
            type="button"
            aria-selected={mode === 'register'}
            aria-controls="panel-register"
            onClick={() => setMode('register')}
            className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 min-h-[44px] ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md shadow-slate-900/5'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            <span>Criar Conta</span>
          </button>
        </div>

        {/* Tab Panels */}
        <div id="panel-auth" role="tabpanel" tabIndex={0} className="focus:outline-none">
          {mode === 'login' ? (
            <LoginForm onSuccess={handleAuthSuccess} />
          ) : (
            <RegisterForm onSuccess={handleAuthSuccess} />
          )}
        </div>

        {/* Bottom Toggle Text */}
        <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800 text-center">
          {mode === 'login' ? (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Ainda não possui uma conta?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 underline underline-offset-4 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
              >
                Cadastre-se grátis
              </button>
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Já tem uma conta criada?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 underline underline-offset-4 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
              >
                Faça login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
