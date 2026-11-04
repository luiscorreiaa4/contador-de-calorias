import React, { useState, useEffect, Suspense } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { NewMealModalProvider } from '../../context/NewMealModalProvider';
import { ThemeProvider } from '../../context/ThemeProvider';
import { ToastProvider } from '../../context/ToastProvider';
import { AppHeader } from './AppHeader';
import { SwipeMain } from '../../navigation/SwipeMain';
import { BottomNav } from './BottomNav';
import { BottomNavTabs } from '../../navigation/BottomNavTabs';
import { Footer } from './Footer';
import { APP_MIN_H, RouteLoading } from './RouteLoading';

const RootShell: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const showBottomNav = isAuthenticated && !!user?.onboarding_completed;
  // `=== false`: no Node (prerender) `navigator` existe mas `onLine` é undefined.
  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== 'undefined' && navigator.onLine === false,
  );

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
    // overflow-x-clip (não hidden): hidden cria contêiner de rolagem e desliga o sticky do cabeçalho.
    <div
      className={`min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col justify-between relative overflow-x-hidden supports-[overflow:clip]:overflow-x-clip ${
        showBottomNav ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0' : ''
      }`}
    >
      {isOffline && (
        <div
          role="status"
          className="w-full bg-warning text-warning-foreground py-1.5 px-4 text-center font-black text-xs uppercase tracking-wider border-b-2 border-border flex items-center justify-center gap-2"
        >
          <span>SEM CONEXÃO. MOSTRANDO OS DADOS SALVOS NO APARELHO</span>
        </div>
      )}
      {/* Skip to Main Content Link (A11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-[calc(0.5rem+env(safe-area-inset-top))] focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border-2 focus:border-border focus:shadow-hard focus:outline-none focus:font-black focus:text-xs focus:uppercase"
      >
        Pular para o conteúdo principal
      </a>

      {/* Pinta a área da barra de status do iPhone mesmo com o cabeçalho oculto (0px fora do iOS). */}
      <div
        aria-hidden="true"
        className="md:hidden fixed inset-x-0 top-0 z-[60] h-[env(safe-area-inset-top)] bg-background transition-colors duration-300"
      />

      {/* App Header */}
      <AppHeader />

      {/* Main Content (Routes Area) */}
      <SwipeMain
        enabled={showBottomNav}
        className={`flex-1 flex items-center justify-center z-10 my-8 sm:my-12 pb-8 sm:pb-16 ${
          showBottomNav ? APP_MIN_H : ''
        }`}
      >
        <Suspense fallback={<RouteLoading tall={showBottomNav} />}>
          {showBottomNav ? <BottomNavTabs outlet={<Outlet />} /> : <Outlet />}
        </Suspense>
      </SwipeMain>

      {/* Footer */}
      {/* Com a barra inferior, o rodapé some no mobile; os links legais ficam na tela Conta. */}
      <div className={showBottomNav ? 'hidden md:block' : undefined}>
        <Footer />
      </div>

      {showBottomNav && <BottomNav />}
    </div>
  );
};

export const RootLayout: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <NewMealModalProvider>
        <RootShell />
      </NewMealModalProvider>
    </ToastProvider>
  </ThemeProvider>
);
