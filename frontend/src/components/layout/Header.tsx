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
    <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
          <Flame className="w-5 h-5 fill-current" aria-hidden="true" />
        </div>
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          NutriTrack
        </span>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Sessão Ativa
          </span>
        )}
        <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />
      </div>
    </header>
  );
};
