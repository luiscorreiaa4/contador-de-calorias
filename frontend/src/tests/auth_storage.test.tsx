import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import type { UserProfile } from '../services/auth.service';

describe('AuthContext storage privacy (PC-19 / SEC-018)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const fullUser: UserProfile = {
    id: 'user-123',
    name: 'Atleta Silva',
    email: 'atleta@teste.com',
    goal: 'ganhar_massa',
    sex: 'masculino',
    birth_date: '1995-05-10',
    weight: 85.5,
    height: 182,
    body_fat: 12.5,
    activity_level: 'muito_ativo',
    daily_calories_goal: 3000,
    daily_proteins_goal: 180,
    onboarding_completed: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('não deve gravar dados biométricos ou metas de saúde em localStorage no setAuthSession', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setAuthSession(fullUser, 'jwt_token_123');
    });

    // Em memória, os dados completos estão disponíveis para a UI
    expect(result.current.user?.weight).toBe(85.5);
    expect(result.current.user?.daily_calories_goal).toBe(3000);

    // No localStorage, apenas dados seguros de sessão podem existir
    const rawSession = localStorage.getItem('user_session');
    expect(rawSession).not.toBeNull();
    const stored = JSON.parse(rawSession!);

    expect(stored.id).toBe('user-123');
    expect(stored.name).toBe('Atleta Silva');
    expect(stored.email).toBe('atleta@teste.com');
    expect(stored.onboarding_completed).toBe(true);

    // Dados sensíveis de saúde NUNCA devem estar no localStorage
    expect(stored.weight).toBeUndefined();
    expect(stored.height).toBeUndefined();
    expect(stored.body_fat).toBeUndefined();
    expect(stored.daily_calories_goal).toBeUndefined();
    expect(stored.daily_proteins_goal).toBeUndefined();
    expect(stored.birth_date).toBeUndefined();
    expect(stored.sex).toBeUndefined();
  });

  it('não deve gravar dados biométricos em localStorage no updateUserSession', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.updateUserSession(fullUser);
    });

    const rawSession = localStorage.getItem('user_session');
    const stored = JSON.parse(rawSession!);

    expect(stored.weight).toBeUndefined();
    expect(stored.body_fat).toBeUndefined();
    expect(stored.daily_calories_goal).toBeUndefined();
  });

  it('deve hidratar a sessão inicial a partir do localStorage sem conter dados biométricos (A-129)', () => {
    const savedSession = {
      id: 'user-persistido',
      name: 'Usuário Persistido',
      email: 'persistido@teste.com',
      onboarding_completed: true,
    };
    localStorage.setItem('user_session', JSON.stringify(savedSession));
    localStorage.setItem('auth_token', 'token-valido-123');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('token-valido-123');
    expect(result.current.user?.id).toBe('user-persistido');
    expect(result.current.user?.name).toBe('Usuário Persistido');
    expect(result.current.user?.email).toBe('persistido@teste.com');
    expect(result.current.user?.weight).toBeUndefined();
    expect(result.current.user?.daily_calories_goal).toBeUndefined();
  });

  it('deve descartar sessão incompleta ou corrompida e inicializar limpo sem crash (A-129)', () => {
    localStorage.setItem('user_session', JSON.stringify({ invalidField: true }));
    localStorage.setItem('auth_token', 'token-invalido');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user_session')).toBeNull();
  });
});
