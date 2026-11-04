import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { createTestRouter } from '../router';
import { AuthProvider } from '../context/AuthContext';

const loginAs = (onboarding_completed: boolean) => {
  localStorage.setItem('auth_session', '1');
  localStorage.setItem(
    'user_session',
    JSON.stringify({ id: '1', name: 'Tester', email: 'tester@test.com', onboarding_completed }),
  );
};

const renderAt = (path: string) => {
  const router = createTestRouter([path]);
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return router;
};

describe('Usuário logado em rotas públicas (#34/#35)', () => {
  beforeEach(() => localStorage.clear());

  it.each(['/login', '/cadastro', '/'])('%s leva a /app sem mostrar 404', async (path) => {
    loginAs(true);
    const router = renderAt(path);
    await waitFor(() => expect(router.state.location.pathname).toBe('/app'));
    expect(screen.queryByText(/página não encontrada/i)).not.toBeInTheDocument();
  });

  it.each(['/login', '/'])('%s leva ao onboarding se ele não terminou', async (path) => {
    loginAs(false);
    const router = renderAt(path);
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/onboarding'));
  });

  it('deslogado, / continua na landing', async () => {
    const router = renderAt('/');
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 1 }).length).toBe(1));
    expect(router.state.location.pathname).toBe('/');
  });
});
