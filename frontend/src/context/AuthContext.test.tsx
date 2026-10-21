import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import type { UserProfile } from '../services/auth.service';

describe('AuthContext Component & State (PC-34 / TST-011)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockUser: UserProfile = {
    id: 'user-001',
    name: 'Atleta Teste',
    email: 'atleta@teste.com',
    goal: 'perder_peso',
    sex: 'masculino',
    birth_date: '1992-04-12',
    weight: 78,
    height: 180,
    body_fat: 14,
    activity_level: 'moderadamente_ativo',
    daily_calories_goal: 2200,
    daily_proteins_goal: 150,
    onboarding_completed: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('inicia desautenticado quando não há dados em localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('autentica corretamente ao invocar setAuthSession', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setAuthSession(mockUser, 'test-jwt-token');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe('user-001');
    expect(result.current.token).toBe('test-jwt-token');
    expect(localStorage.getItem('auth_token')).toBe('test-jwt-token');
  });

  it('limpa os estados e o localStorage ao chamar logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setAuthSession(mockUser, 'test-jwt-token');
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_session')).toBeNull();
  });

  it('desloga automaticamente ao receber o evento customizado auth:unauthorized', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setAuthSession(mockUser, 'test-jwt-token');
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  it('recupera-se graciosamente sem travar quando user_session no localStorage estiver corrompido (A-074)', () => {
    localStorage.setItem('user_session', '{corrupted_json_content:');
    localStorage.setItem('auth_token', 'token-corrompido');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user_session')).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('hidrata corretamente a sessão e o token salvos no localStorage (A-129)', () => {
    localStorage.setItem(
      'user_session',
      JSON.stringify({
        id: 'user-hidrata',
        name: 'Usuário Hidratado',
        email: 'hidrata@teste.com',
        onboarding_completed: true,
      })
    );
    localStorage.setItem('auth_token', 'token-recuperado');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('token-recuperado');
    expect(result.current.user?.id).toBe('user-hidrata');
    expect(result.current.user?.email).toBe('hidrata@teste.com');
    expect(result.current.isLoadingProfile).toBe(true);
  });

  it('rejeita e limpa sessão parcial sem email ou sem id no localStorage (A-129)', () => {
    localStorage.setItem('user_session', JSON.stringify({ id: 'user-sem-email' }));
    localStorage.setItem('auth_token', 'token-sem-email');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user_session')).toBeNull();
  });

  it('grava no sessionStorage quando rememberMe for falso (A-081)', () => {
    sessionStorage.clear();
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setAuthSession(mockUser, 'test-jwt-session', false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(sessionStorage.getItem('auth_token')).toBe('test-jwt-session');
    expect(localStorage.getItem('auth_token')).toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
