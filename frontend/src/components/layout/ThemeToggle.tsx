import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  size?: 'sm' | 'md';
}

export function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { darkMode, toggleTheme } = useTheme();
  const box = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const icon = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const Icon = darkMode ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
      className={`shrink-0 flex items-center justify-center ${box} border-2 border-border bg-card hover:bg-secondary transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group`}
    >
      <Icon className={`${icon} group-hover:text-primary-ink transition-colors`} />
    </button>
  );
}
