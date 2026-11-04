import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { createTestRouter } from '../../../router';
import { AuthProvider } from '../../../context/AuthContext';
import { FAQ } from '../../../seo/pages';

describe('LandingPage', () => {
  it('renderiza em "/" com um único h1, CTAs e o FAQ', async () => {
    localStorage.clear();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <RouterProvider router={createTestRouter(['/'])} />
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /criar conta/i })).toHaveAttribute('href', '/cadastro');
    expect(screen.getByRole('heading', { name: /perguntas frequentes/i })).toBeInTheDocument();
    for (const { question } of FAQ) expect(screen.getByText(question)).toBeInTheDocument();
  });
});
