import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getCurrentUserProfile, type UserProfile } from '../services/auth.service';

interface SafeUserSession {
  id: string;
  name: string;
  email: string;
  onboarding_completed: boolean;
}

const sanitizeUserSession = (userData: UserProfile): SafeUserSession => ({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  onboarding_completed: userData.onboarding_completed,
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
    localStorage.removeItem('user_session');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_session');
    sessionStorage.removeItem('auth_token');
    return null;
  }
}

function getStoredAuthToken(): string | null {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoadingProfile: boolean;
  setAuthSession: (user: UserProfile, token: string, rememberMe?: boolean) => void;
  updateUserSession: (user: UserProfile, refreshedToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredAuthToken);
  const [user, setUser] = useState<UserProfile | null>(getStoredUserSession);

  // Perfil completo contém created_at; sessão sanitizada do storage não contém
  const isLoadingProfile = !!token && (!user || !('created_at' in user));

  const setAuthSession = useCallback((userData: UserProfile, authToken: string, rememberMe: boolean = true) => {
    setUser(userData);
    setToken(authToken);

    const serialized = JSON.stringify(sanitizeUserSession(userData));

    if (rememberMe) {
      localStorage.setItem('user_session', serialized);
      localStorage.setItem('auth_token', authToken);
      sessionStorage.removeItem('user_session');
      sessionStorage.removeItem('auth_token');
    } else {
      sessionStorage.setItem('user_session', serialized);
      sessionStorage.setItem('auth_token', authToken);
      localStorage.removeItem('user_session');
      localStorage.removeItem('auth_token');
    }
  }, []);

  const updateUserSession = useCallback((userData: UserProfile, refreshedToken?: string) => {
    setUser(userData);
    const serialized = JSON.stringify(sanitizeUserSession(userData));
    // Mantém o mesmo tipo de armazenamento escolhido no login e persiste o token
    // renovado após troca de senha/e-mail (A8).
    const storage = sessionStorage.getItem('auth_token') !== null ? sessionStorage : localStorage;
    if (refreshedToken) {
      setToken(refreshedToken);
      storage.setItem('auth_token', refreshedToken);
    }
    storage.setItem('user_session', serialized);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user_session');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_session');
    sessionStorage.removeItem('auth_token');
  }, []);

  useEffect(() => {
    if (token) {
      let isMounted = true;
      getCurrentUserProfile()
        .then((fullProfile) => {
          if (isMounted) {
            setUser(fullProfile);
          }
        })
        .catch(() => {
          // Em caso de erro 401, o apiFetch já remove os tokens e dispara auth:unauthorized
        });

      return () => {
        isMounted = false;
      };
    }
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const authValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoadingProfile,
      setAuthSession,
      updateUserSession,
      logout,
    }),
    [user, token, isLoadingProfile, setAuthSession, updateUserSession, logout]
  );

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
