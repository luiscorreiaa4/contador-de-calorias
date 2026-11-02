import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { createTestRouter } from '../router';

describe('Acessibilidade: Skip Link (#33)', () => {
  it('deve renderizar o skip link apontando para o id do elemento main', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const router = createTestRouter(['/login']);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>,
    );

    const skipLink = screen.getByRole('link', { name: /pular para o conteúdo principal/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink.className).toContain('sr-only');
    expect(skipLink.className).toContain('focus:not-sr-only');

    const mainElement = document.getElementById('main-content');
    expect(mainElement).not.toBeNull();
    expect(mainElement?.tagName.toLowerCase()).toBe('main');
  });
});
