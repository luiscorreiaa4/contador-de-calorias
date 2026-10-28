import React, { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { NewMealModalProvider } from '../../context/NewMealModalProvider';
import { ThemeProvider } from '../../context/ThemeProvider';
import { AppHeader } from './AppHeader';
import { SwipeMain } from '../../navigation/SwipeMain';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';

const RootShell: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const showBottomNav = isAuthenticated && !!user?.onboarding_completed;
  const [isOffline, setIsOffline] = useState(() => (typeof navigator !== 'undefined' ? !navigator.onLine : false));

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col justify-between relative overflow-x-hidden ${
        showBottomNav ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0' : ''
      }`}
    >
      {isOffline && (
        <div role="status" className="w-full bg-warning text-warning-foreground py-1.5 px-4 text-center font-black text-xs uppercase tracking-wider border-b-2 border-border flex items-center justify-center gap-2">
          <span>MODO OFFLINE ATIVADO — DADOS CARREGADOS DO CACHE LOCAL</span>
        </div>
      )}
      {/* App Header */}
      <AppHeader />

      {/* Main Content (Routes Area) */}
      <SwipeMain enabled={showBottomNav} className="flex-1 flex items-center justify-center z-10 my-8 sm:my-12 pb-8 sm:pb-16">
        <Suspense
          fallback={
            <div className="flex items-center justify-center w-full h-64">
              <div className="animate-spin rounded-none h-8 w-8 border-2 border-border border-b-foreground"></div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </SwipeMain>

      {/* Footer */}
      <Footer />

      {showBottomNav && <BottomNav />}
    </div>
  );
};

export const RootLayout: React.FC = () => (
  <ThemeProvider>
    <NewMealModalProvider>
      <RootShell />
    </NewMealModalProvider>
  </ThemeProvider>
);
