import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  Flame,
  Sun,
  Moon,
  UserCog,
  LogOut,
  ChevronDown,
  Target,
  LayoutDashboard,
} from 'lucide-react';

interface AppHeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onNavigateToEditProfile?: () => void;
  onNavigateToStats?: () => void;
  onNavigateToDashboard?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  darkMode,
  onToggleTheme,
  onNavigateToEditProfile,
  onNavigateToStats,
  onNavigateToDashboard,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleDashboard = () => {
    if (onNavigateToDashboard) onNavigateToDashboard();
    else navigate('/');
    setMenuOpen(false);
  };

  const handleStats = () => {
    if (onNavigateToStats) onNavigateToStats();
    else navigate('/estatisticas');
    setMenuOpen(false);
  };

  const handleEditProfile = () => {
    if (onNavigateToEditProfile) onNavigateToEditProfile();
    else navigate('/perfil');
    setMenuOpen(false);
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Generate avatar initials
  const initials = user?.name
    ? user.name
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b-2 border-border transition-colors duration-300">
      {/* Neon accent top line */}
      <div className="h-1 w-full bg-primary" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer group" onClick={handleDashboard}>
          <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center shadow-hard transition-transform group-hover:-translate-y-0.5 group-hover:shadow-hard-hover">
            <Flame className="w-6 h-6 fill-current" aria-hidden="true" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="font-heading font-black text-lg sm:text-xl tracking-tighter text-foreground uppercase">
                CALORIE<span className="text-primary">SYNC</span>
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase -mt-1 hidden sm:block">
              Alta Performance
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
              className="flex items-center justify-center w-10 h-10 border-2 border-border bg-card hover:bg-secondary transition-colors text-foreground focus:outline-none focus:border-primary group"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 group-hover:text-primary transition-colors" />
              ) : (
                <Moon className="w-5 h-5 group-hover:text-primary transition-colors" />
              )}
            </button>
          )}

          {/* User dropdown — when authenticated */}
          {isAuthenticated && user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
                className="flex items-center gap-3 pl-2 pr-4 py-2 border-2 border-border bg-card hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>

                {/* User Name */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider max-w-[120px] truncate leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${
                    menuOpen ? 'rotate-180 text-primary' : ''
                  }`}
                />
              </button>

              {/* Dropdown panel */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#0a0a0a] border-2 border-border shadow-hard overflow-hidden z-[100] opacity-100">
                  <div className="p-4 border-b-2 border-border bg-zinc-100 dark:bg-[#1a1a1a] flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black font-heading uppercase text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-xs font-bold tracking-widest text-muted-foreground truncate mt-1">
                        {user.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTheme();
                      }}
                      aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
                      className="shrink-0 flex items-center justify-center w-8 h-8 border-2 border-border bg-zinc-100 dark:bg-[#1a1a1a] hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-foreground focus:outline-none focus:border-primary group"
                    >
                      {darkMode ? (
                        <Sun className="w-4 h-4 group-hover:text-primary transition-colors" />
                      ) : (
                        <Moon className="w-4 h-4 group-hover:text-primary transition-colors" />
                      )}
                    </button>
                  </div>

                  <div className="p-2 flex flex-col gap-1">
                    <button
                      onClick={handleDashboard}
                      className="flex items-center w-full px-3 py-3 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-3" />
                      Dashboard
                    </button>
                    <button
                      onClick={handleStats}
                      className="flex items-center w-full px-3 py-3 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                    >
                      <Target className="w-4 h-4 mr-3" />
                      Estatísticas
                    </button>
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center w-full px-3 py-3 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                    >
                      <UserCog className="w-4 h-4 mr-3" />
                      Configurações
                    </button>
                  </div>

                  <div className="p-2 border-t-2 border-border bg-background">
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-3 py-3 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors group"
                    >
                      <LogOut className="w-4 h-4 mr-3 transition-transform group-hover:-translate-x-1" />
                      Sair da conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:block">
              {/* Optional: Add a CTA here if not logged in */}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
