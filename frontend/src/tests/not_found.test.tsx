import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { createTestRouter } from '../router';

describe('NotFoundPage (404) (#27)', () => {
  it('deve renderizar a página 404 brutalista para rotas inexistentes com link de retorno', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const router = createTestRouter(['/endereco-inexistente-123']);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: /página não encontrada/i })
    ).toBeInTheDocument();

    expect(screen.getByText('404')).toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: /voltar ao início/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });
});

