import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../ThemeToggle';
import { Flame } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, onToggleTheme }) => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="w-full px-5 sm:px-8 py-4 flex items-center justify-between z-10 border-b border-zinc-100 dark:border-zinc-900">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
          <Flame className="w-4 h-4 fill-current" aria-hidden="true" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-zinc-800 dark:text-zinc-100">
          Contador de Calorias
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
            Sessão Ativa
          </span>
        )}
        <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />
      </div>
    </header>
  );
};
