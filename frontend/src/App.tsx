import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/public/LoginPage';
import { DashboardPage } from './pages/private/DashboardPage';
import { EditProfilePage } from './pages/private/EditProfilePage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AppHeader } from './components/layout/AppHeader';
import { Footer } from './components/layout/Footer';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'edit-profile'>('dashboard');

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 flex flex-col justify-between relative overflow-x-hidden">
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%2310b981' fill-opacity='0.25'/%3E%3C/svg%3E")`,  
          backgroundSize: '20px 20px',
        }}
      />
      {/* Single ambient glow — top right */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Modern App Header */}
      <AppHeader
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onNavigateToEditProfile={
          isAuthenticated && user?.onboarding_completed
            ? () => setCurrentView('edit-profile')
            : undefined
        }
      />

      {/* Main Content (Routes Area) */}
      <main className="flex-1 flex items-center justify-center z-10 my-8 sm:my-12 pb-8 sm:pb-16">
        {isAuthenticated ? (
          <ProtectedRoute>
            {!user?.onboarding_completed ? (
              <OnboardingFlow />
            ) : currentView === 'dashboard' ? (
              <DashboardPage />
            ) : (
              <EditProfilePage onBack={() => setCurrentView('dashboard')} />
            )}
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
