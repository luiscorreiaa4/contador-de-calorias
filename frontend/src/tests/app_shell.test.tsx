import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { createTestRouter } from '../router';
import { AuthProvider } from '../context/AuthContext';

function renderApp(path: string, onboarded: boolean) {
  localStorage.setItem('auth_session', 'test-token');
  localStorage.setItem(
    'user_session',
    JSON.stringify({ id: '1', name: 'Test', email: 't@e.com', onboarding_completed: onboarded }),
  );
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider>
        <RouterProvider router={createTestRouter([path])} />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('RootLayout — Fase 1', () => {
  it('com a barra inferior, o rodapé fica escondido abaixo de md e o main reserva a altura da tela', async () => {
    renderApp('/app/conta', true);
    await screen.findByRole('heading', { name: 'Conta' }, { timeout: 15000 });
    const footer = document.querySelector('footer')!;
    expect(footer.parentElement).toHaveClass('hidden', 'md:block');
    expect(screen.getByRole('main').className).toContain('min-h-[calc(100dvh-8rem)]');
  });

  it('sem a barra inferior (deslogado), o rodapé segue visível', async () => {
    localStorage.clear();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <RouterProvider router={createTestRouter(['/termos'])} />
        </AuthProvider>
      </QueryClientProvider>,
    );
    await screen.findByRole('main');
    expect(document.querySelector('footer')!.parentElement).not.toHaveClass('hidden');
  });
});
