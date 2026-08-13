import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Flame,
  Sun,
  Moon,
  UserCog,
  LogOut,
  ChevronDown,
  Sparkles,
  Target,
} from 'lucide-react';

interface AppHeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onNavigateToEditProfile?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  darkMode,
  onToggleTheme,
  onNavigateToEditProfile,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const goalFormatted = user?.goal
    ? user.goal.replace(/_/g, ' ')
    : 'Perder peso';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/70 dark:border-zinc-800/70 transition-colors duration-300">
      {/* Subtle top glowing accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60 dark:opacity-40" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Glow backing */}
            <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-400/20 rounded-xl blur-sm" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 ring-1 ring-white/20">
              <Flame className="w-5 h-5 fill-current transition-transform duration-300 hover:scale-110" aria-hidden="true" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                Contador de{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                  Calorias
                </span>
              </span>
            </div>
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 -mt-1 hidden sm:block">
              Nutrição & Metas Diárias
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme toggle button — only shown when not authenticated */}
          {!isAuthenticated && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={darkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              className="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 shadow-xs flex items-center justify-center min-w-[42px] min-h-[42px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 hover:-rotate-12" />
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
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:border-emerald-300 dark:hover:border-emerald-700/60 shadow-xs hover:shadow-md transition-all duration-200 min-h-[42px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 group"
              >
                {/* Avatar with gradient & ring */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ring-2 ring-emerald-500/20">
                  {initials}
                </div>

                {/* User Name */}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 max-w-[120px] truncate leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-zinc-400 capitalize truncate max-w-[120px]">
                    {goalFormatted}
                  </span>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-transform duration-200 ${
                    menuOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                />
              </button>

              {/* Dropdown panel */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-zinc-900/15 dark:shadow-black/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-50 p-2">
                  {/* User Profile Card Header */}
                  <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-zinc-900 dark:to-transparent rounded-xl p-3.5 border border-emerald-500/15 dark:border-emerald-500/10 mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-emerald-600/30 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-emerald-500/15 dark:border-emerald-500/10">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 capitalize truncate font-medium">
                        <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {goalFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1">
                    {/* Editar Perfil */}
                    {onNavigateToEditProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onNavigateToEditProfile();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <UserCog className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs leading-tight">Editar Perfil</p>
                          <p className="text-[11px] text-zinc-400 truncate">Metas e dados corporais</p>
                        </div>
                      </button>
                    )}

                    {/* Alternar Tema */}
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 group-hover:bg-violet-500 group-hover:text-white transition-colors">
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-tight">
                          {darkMode ? 'Modo Claro' : 'Modo Escuro'}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                        </p>
                      </div>
                      {/* Visual Switch Indicator */}
                      <div
                        className={`w-8 h-4.5 rounded-full transition-colors shrink-0 flex items-center px-0.5 ${
                          darkMode ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            darkMode ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </div>

                  {/* Logout item */}
                  <div className="pt-1.5 mt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-tight">Sair da Conta</p>
                        <p className="text-[11px] text-red-400/80 dark:text-red-400/60 truncate">Encerrar sessão</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-out pill badge */
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/40 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Bem-vindo</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
