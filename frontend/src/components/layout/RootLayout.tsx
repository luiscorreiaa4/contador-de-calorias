import React, { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';

export const RootLayout: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col justify-between relative overflow-x-hidden">
      {/* App Header */}
      <AppHeader darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* Main Content (Routes Area) */}
      <main className="flex-1 flex items-center justify-center z-10 my-8 sm:my-12 pb-8 sm:pb-16">
        <Suspense
          fallback={
            <div className="flex items-center justify-center w-full h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
