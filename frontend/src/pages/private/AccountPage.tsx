import React from 'react';
import { Link } from 'react-router';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../../components/layout/ThemeToggle';
import { ACCOUNT_LINK_ITEMS, visibleItems } from '../../navigation/nav-items';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();

  const initials = user?.name
    ? user.name
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'U';

  const links = visibleItems(ACCOUNT_LINK_ITEMS, user?.role === 'admin');

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-3">
        <h1 className="font-heading font-black text-3xl sm:text-5xl uppercase tracking-tighter">Conta</h1>
        <p className="text-muted-foreground">Seu perfil, suas configurações e a aparência do app.</p>
      </div>

      <section aria-label="Usuário" className="flex items-center gap-4 border-2 border-border bg-card p-4 shadow-hard">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-foreground text-background text-lg font-black">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-lg font-black uppercase text-foreground">{user?.name}</p>
          <p className="truncate text-xs font-bold tracking-widest text-muted-foreground">{user?.email}</p>
        </div>
      </section>

      <nav aria-label="Atalhos da conta" className="flex flex-col gap-3">
        {links.map(({ id, label, to, icon: Icon }) => (
          <Link
            key={id}
            to={to}
            className="flex min-h-14 items-center gap-4 border-2 border-border bg-card px-4 text-xs font-black uppercase tracking-widest text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="flex-1 truncate">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
      </nav>

      <div className="flex min-h-14 items-center justify-between gap-4 border-2 border-border bg-card px-4">
        <span className="text-xs font-black uppercase tracking-widest text-foreground">
          Tema {darkMode ? 'escuro' : 'claro'}
        </span>
        <ThemeToggle />
      </div>

      <button
        type="button"
        onClick={logout}
        className="flex min-h-14 w-full items-center gap-4 border-2 border-destructive px-4 text-xs font-black uppercase tracking-widest text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        Sair da conta
      </button>
    </div>
  );
};
