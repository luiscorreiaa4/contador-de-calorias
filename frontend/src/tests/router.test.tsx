import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { createTestRouter } from '../router';
import { AuthProvider } from '../context/AuthContext';

describe('Router & Navigation (PC-21 / D-16)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('redireciona rota protegida / para /login quando não autenticado', async () => {
    const router = createTestRouter(['/']);
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /bem-vindo de volta/i })).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe('/login');
  });

  it('renderiza /cadastro com tab Criar conta selecionada', async () => {
    const router = createTestRouter(['/cadastro']);
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    );

    const registerTab = await screen.findByRole('tab', { name: /criar conta/i });
    expect(registerTab).toHaveAttribute('aria-selected', 'true');
    expect(router.state.location.pathname).toBe('/cadastro');
  });

  it('redireciona para /onboarding quando usuário autenticado não concluiu onboarding', async () => {
    localStorage.setItem('auth_token', 'test_token');
    localStorage.setItem(
      'user_session',
      JSON.stringify({ id: '1', name: 'Tester', email: 'tester@test.com', onboarding_completed: false })
    );

    const router = createTestRouter(['/']);
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/onboarding');
    });
  });

  it('permite acesso a /estatisticas quando autenticado e com onboarding concluído', async () => {
    localStorage.setItem('auth_token', 'test_token');
    localStorage.setItem(
      'user_session',
      JSON.stringify({ id: '1', name: 'Tester', email: 'tester@test.com', onboarding_completed: true })
    );

    const router = createTestRouter(['/estatisticas']);
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/evolucao/alimentacao');
    });
  });

  it('permite acesso a /perfil quando autenticado e com onboarding concluído', async () => {
    localStorage.setItem('auth_token', 'test_token');
    localStorage.setItem(
      'user_session',
      JSON.stringify({ id: '1', name: 'Tester', email: 'tester@test.com', onboarding_completed: true })
    );

    const router = createTestRouter(['/perfil']);
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/perfil');
    });
  });

  it('renderiza a recuperação de senha como rota pública', async () => {
    const router = createTestRouter(['/esqueci-senha']);
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: /recuperar senha/i })
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/esqueci-senha');
  });

  it('renderiza a confirmação de e-mail sem estado do router', async () => {
    const router = createTestRouter(['/verificar-email']);
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: /confirme seu e-mail/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail da conta/i)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/verificar-email');
  });
});
