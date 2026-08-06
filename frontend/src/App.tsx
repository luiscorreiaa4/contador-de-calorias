import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/public/LoginPage';
import { DashboardPage } from './pages/private/DashboardPage';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

function AppContent() {
  const { isAuthenticated } = useAuth();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Dynamic Ambient Glows */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Separate Layout Header */}
      <Header darkMode={darkMode} onToggleTheme={toggleTheme} />

      {/* Main Content (Routes Area) */}
      <main className="flex-1 flex items-center justify-center z-10 my-4">
        {isAuthenticated ? (
          <ProtectedRoute>
            <DashboardPage />
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
