import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getCurrentUserProfile, logoutUser, type UserProfile } from '../services/auth.service';
import { clearStoredSession, hasStoredSession } from '../services/api';

interface SafeUserSession {
  id: string;
  name: string;
  email: string;
  onboarding_completed: boolean;
  role?: 'user' | 'admin';
}

const sanitizeUserSession = (userData: UserProfile): SafeUserSession => ({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  onboarding_completed: userData.onboarding_completed,
  role: userData.role,
});

/**
 * Recupera e valida com segurança a sessão armazenada, protegendo contra JSON corrompido (A-074).
 */
function getStoredUserSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem('user_session') || sessionStorage.getItem('user_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.id === 'string' &&
      typeof parsed.email === 'string'
    ) {
      return parsed as UserProfile;
    }
    localStorage.removeItem('user_session');
    sessionStorage.removeItem('user_session');
    return null;
  } catch (err) {
    console.warn('Sessão armazenada corrompida. Limpando armazenamento:', err);
    clearStoredSession();
    return null;
  }
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoadingProfile: boolean;
  setAuthSession: (user: UserProfile, rememberMe?: boolean) => void;
  updateUserSession: (user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // O JWT fica só no cookie HttpOnly; aqui há apenas um marcador não secreto de sessão.
  const [hasSession, setHasSession] = useState<boolean>(hasStoredSession);
  const [user, setUser] = useState<UserProfile | null>(getStoredUserSession);

  // Perfil completo contém created_at; sessão sanitizada do storage não contém
  const isLoadingProfile = hasSession && (!user || !('created_at' in user));

  const setAuthSession = useCallback((userData: UserProfile, rememberMe: boolean = true) => {
    setUser(userData);
    setHasSession(true);

    const serialized = JSON.stringify(sanitizeUserSession(userData));
    const [keep, drop] = rememberMe
      ? [localStorage, sessionStorage]
      : [sessionStorage, localStorage];
    keep.setItem('user_session', serialized);
    keep.setItem('auth_session', '1');
    drop.removeItem('user_session');
    drop.removeItem('auth_session');
  }, []);

  const updateUserSession = useCallback((userData: UserProfile) => {
    setUser(userData);
    // Mantém o mesmo tipo de armazenamento escolhido no login.
    const storage = sessionStorage.getItem('auth_session') !== null ? sessionStorage : localStorage;
    storage.setItem('user_session', JSON.stringify(sanitizeUserSession(userData)));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setHasSession(false);
    clearStoredSession();
    // shortcut: fire-and-forget; se falhar, o cookie expira sozinho (TTL de 1 dia).
    void logoutUser().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hasSession) {
      let isMounted = true;
      getCurrentUserProfile()
        .then((fullProfile) => {
          if (isMounted) {
            setUser(fullProfile);
          }
        })
        .catch(() => {
          // Em caso de erro 401, o apiFetch já limpa a sessão e dispara auth:unauthorized
        });

      return () => {
        isMounted = false;
      };
    }
  }, [hasSession]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setHasSession(false);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const authValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user && hasSession,
      isLoadingProfile,
      setAuthSession,
      updateUserSession,
      logout,
    }),
    [user, hasSession, isLoadingProfile, setAuthSession, updateUserSession, logout],
  );

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
