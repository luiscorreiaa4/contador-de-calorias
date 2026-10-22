import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  Flame,
  Sun,
  Moon,
  UserCog,
  Settings,
  Bell,
  Lock,
  Shield,
  LogOut,
  ChevronDown,
  Target,
  LayoutDashboard,
  TrendingUp,
  Database,
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const handleDashboard = () => {
    if (onNavigateToDashboard) onNavigateToDashboard();
    else navigate('/');
    setMenuOpen(false);
  };

  const handleStats = () => {
    if (onNavigateToStats) onNavigateToStats();
    else navigate('/evolucao/alimentacao');
    setMenuOpen(false);
  };

  const handleEditProfile = () => {
    if (onNavigateToEditProfile) onNavigateToEditProfile();
    else navigate('/perfil');
    setMenuOpen(false);
  };

  const primaryLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/evolucao', label: 'Evolução', icon: TrendingUp },
    { to: '/metas', label: 'Metas', icon: Target },
    ...(user?.role === 'admin' ? [{ to: '/admin/alimentos', label: 'Catálogo', icon: Database }] : []),
    { to: '/perfil', label: 'Perfil', icon: UserCog },
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  // Desktop usa a barra de abas; o dropdown só repete os links no mobile.
  const showMainNav = isAuthenticated && !!user?.onboarding_completed;

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
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

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
        <button type="button" aria-label="CalorieSync — Dashboard" className="flex items-center gap-3 shrink-0 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" onClick={handleDashboard}>
          <div className="w-10 h-10 bg-primary text-primary-foreground border-2 border-black flex items-center justify-center shadow-hard transition-transform group-hover:-translate-y-0.5 group-hover:shadow-hard-hover">
            <Flame className="w-6 h-6 fill-current" aria-hidden="true" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="font-heading font-black text-lg sm:text-xl tracking-tighter text-foreground uppercase">
                CALORIE<span className="bg-primary text-primary-foreground px-1 ml-0.5">SYNC</span>
              </span>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase -mt-1 hidden sm:block">
              Alta Performance
            </span>
          </div>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={darkMode ? 'Modo claro' : 'Modo escuro'}
              className="flex items-center justify-center w-10 h-10 border-2 border-border bg-card hover:bg-secondary transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 group-hover:text-primary-ink transition-colors" />
              ) : (
                <Moon className="w-5 h-5 group-hover:text-primary-ink transition-colors" />
              )}
            </button>
          )}

          {/* User dropdown — when authenticated */}
          {isAuthenticated && user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Menu da conta"
                ref={menuButtonRef}
                aria-controls="account-navigation"
                aria-expanded={menuOpen}
                className="flex items-center gap-3 pl-2 pr-4 py-2 border-2 border-border bg-card hover:border-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group"
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
                  className={`w-4 h-4 text-muted-foreground group-hover:text-primary-ink transition-transform duration-200 ${
                    menuOpen ? 'rotate-180 text-primary-ink' : ''
                  }`}
                />
              </button>

              {/* Dropdown panel */}
              {menuOpen && (
                <div id="account-navigation" className="absolute right-0 top-full mt-2 w-64 bg-card border-2 border-border shadow-hard overflow-hidden z-[100] opacity-100">
                  <div className="p-4 border-b-2 border-border bg-secondary flex justify-between items-start gap-2">
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
                      className="shrink-0 flex items-center justify-center w-8 h-8 border-2 border-border bg-card hover:bg-secondary transition-colors text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background group"
                    >
                      {darkMode ? (
                        <Sun className="w-4 h-4 group-hover:text-primary-ink transition-colors" />
                      ) : (
                        <Moon className="w-4 h-4 group-hover:text-primary-ink transition-colors" />
                      )}
                    </button>
                  </div>

                  <nav aria-label="Menu da conta" className="p-2 flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
                    <div className={`flex flex-col gap-1 ${showMainNav ? 'md:hidden' : ''}`}>
                      {primaryLinks.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} end={to === '/'} onClick={event => {
                          setMenuOpen(false);
                          if (to === '/' && onNavigateToDashboard) { event.preventDefault(); handleDashboard(); }
                          if (to === '/evolucao' && onNavigateToStats) { event.preventDefault(); handleStats(); }
                          if (to === '/perfil' && onNavigateToEditProfile) { event.preventDefault(); handleEditProfile(); }
                        }} className={({ isActive }) => `flex items-center px-3 py-3 text-xs font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-primary text-primary-foreground border-2 border-black' : 'hover:bg-secondary'}`}>
                          <Icon className="w-4 h-4 mr-3" aria-hidden="true" />{label}
                        </NavLink>
                      ))}
                    </div>
                    <div className={`border-t-2 border-border mt-1 pt-2 ${showMainNav ? 'md:border-t-0 md:mt-0 md:pt-0' : ''}`}>
                      {[
                        { to: '/configuracoes/notificacoes', label: 'Notificações', icon: Bell },
                        { to: '/configuracoes/seguranca', label: 'Segurança', icon: Lock },
                        { to: '/configuracoes/privacidade', label: 'Privacidade e dados', icon: Shield },
                      ].map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className="flex items-center px-3 py-3 text-xs font-bold uppercase tracking-wider hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className="w-4 h-4 mr-3" aria-hidden="true" />{label}</NavLink>)}
                    </div>
                  </nav>

                  <div className="p-2 border-t-2 border-border bg-background">
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-3 py-3 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      {showMainNav && (
        <div className="hidden md:block border-t-2 border-border bg-card">
          <nav aria-label="Navegação principal" className="max-w-5xl mx-auto px-6 flex items-stretch gap-1">
            {primaryLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2 px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-4 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                    isActive
                      ? 'border-foreground text-foreground bg-secondary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${isActive ? 'text-primary-ink' : 'group-hover:text-primary-ink'}`}
                      aria-hidden="true"
                    />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
