import { createContext, useContext } from 'react';

export interface ThemeContextValue {
  darkMode: boolean;
  toggleTheme: () => void;
}

/** Tema salvo ou, sem escolha salva, o do sistema. */
export function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false; // prerender no build
  return (
    localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return context;
}
