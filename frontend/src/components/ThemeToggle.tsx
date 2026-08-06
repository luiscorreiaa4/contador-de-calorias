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
      className="p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 flex items-center justify-center min-w-[40px] min-h-[40px]"
    >
      {darkMode ? (
        <Sun className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
};
