import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

/** Encerra a sessão e leva à landing, como em apps grandes (Notion, Figma, Todoist). */
export function useSignOut() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return useCallback(async () => {
    // Sai de /app antes de limpar a sessão; senão o ProtectedRoute redireciona para /login.
    await navigate('/', { replace: true });
    logout();
  }, [navigate, logout]);
}
