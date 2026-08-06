import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={darkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
      className="p-3 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm flex items-center justify-center min-w-[44px] min-h-[44px]"
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700" aria-hidden="true" />
      )}
    </button>
  );
};
