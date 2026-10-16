import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { UserProfile } from '../services/auth.service';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  setAuthSession: (user: UserProfile, token: string) => void;
  updateUserSession: (user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('user_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const setAuthSession = useCallback((userData: UserProfile, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user_session', JSON.stringify(userData));
    localStorage.setItem('auth_token', authToken);
  }, []);

  const updateUserSession = useCallback((userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('user_session', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user_session');
    localStorage.removeItem('auth_token');
  }, []);

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
      setAuthSession,
      updateUserSession,
      logout,
    }),
    [user, token, setAuthSession, updateUserSession, logout]
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
