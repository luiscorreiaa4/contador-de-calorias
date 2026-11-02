import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useNoIndex } from '../hooks/useNoIndex';

interface AdminRouteProps {
  children?: React.ReactNode;
}

/**
 * Rota protegida exclusiva para administradores (UX/Navegação - D-22).
 * A autorização definitiva e segura é sempre realizada pelo backend por PK (B1, B11).
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  useNoIndex();
  const { isAuthenticated, user, isLoadingProfile } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Se o perfil ainda estiver em carregamento inicial na sessão sem role definido
  if (isLoadingProfile && !user?.role) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
          VERIFICANDO PRIVILÉGIOS...
        </p>
      </div>
    );
  }

  // Usuário autenticado comum sem papel admin: redireciona para a raiz
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // #7: o backend bloqueia a API admin sem MFA; aqui só evitamos telas quebradas.
  if (user.mfa_enabled === false) {
    return <Navigate to="/configuracoes/seguranca" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
