import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/public/LoginPage';
import { Suspense, lazy } from 'react';
const DashboardPage = lazy(() => import('./pages/private/DashboardPage').then(m => ({ default: m.DashboardPage })));
const EditProfilePage = lazy(() => import('./pages/private/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const StatsPage = lazy(() => import('./pages/private/StatsPage').then(m => ({ default: m.StatsPage })));
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AppHeader } from './components/layout/AppHeader';
import { Footer } from './components/layout/Footer';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'edit-profile' | 'stats'>('dashboard');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) &&
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
      {/* Removed ambient glows and dot grid to maintain brutalist aesthetic */}

      {/* Modern App Header */}
      <AppHeader
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onNavigateToEditProfile={
          isAuthenticated && user?.onboarding_completed
            ? () => setCurrentView('edit-profile')
            : undefined
        }
        onNavigateToStats={
          isAuthenticated && user?.onboarding_completed
            ? () => setCurrentView('stats')
            : undefined
        }
        onNavigateToDashboard={
          isAuthenticated && user?.onboarding_completed
            ? () => setCurrentView('dashboard')
            : undefined
        }
      />

      {/* Main Content (Routes Area) */}
      <main className="flex-1 flex items-center justify-center z-10 my-8 sm:my-12 pb-8 sm:pb-16">
        {isAuthenticated ? (
          <ProtectedRoute>
            <Suspense fallback={<div className="flex items-center justify-center w-full h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>}>
              {!user?.onboarding_completed ? (
                <OnboardingFlow />
              ) : currentView === 'dashboard' ? (
                <DashboardPage />
              ) : currentView === 'stats' ? (
                <StatsPage />
              ) : (
                <EditProfilePage onBack={() => setCurrentView('dashboard')} />
              )}
            </Suspense>
          </ProtectedRoute>
        ) : (
          <LoginPage />
        )}
      </main>

      {/* Separate Layout Footer */}
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
